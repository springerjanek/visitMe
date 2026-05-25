import os
import cv2
import numpy as np
from pathlib import Path
import albumentations as A
from tqdm import tqdm
import shutil
import random
from sklearn.model_selection import train_test_split

def create_augmented_dataset(source_folder="dataset_yolo_biedra", 
                            output_folder="dataset_yolo_biedra_augmented",
                            augment_factor=2,
                            target_classes=None):
    """target_classes: Lista klas do augmentacji (None = wszystkie)"""
    
    source_path = Path(source_folder)
    output_path = Path(output_folder)
    
    if not source_path.exists():
        print(f"Folder {source_folder} nie istnieje!")
        return
    
    if output_path.exists():
        print(f"Folder {output_folder} już istnieje! Zostanie nadpisany.")
        shutil.rmtree(output_path)
    
    shutil.copytree(source_path, output_path)
    
    splits = ['train', 'val', 'test']
    
    light_aug = A.Compose([
        A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.5),
        A.HueSaturationValue(hue_shift_limit=5, sat_shift_limit=20, val_shift_limit=20, p=0.5),
        A.GaussNoise(var_limit=(10.0, 30.0), p=0.3),
        A.Blur(blur_limit=(3, 5), p=0.3),
    ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))
    
    medium_aug = A.Compose([
        A.RandomRotate90(p=0.3),
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(brightness_limit=0.3, contrast_limit=0.3, p=0.6),
        A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=30, val_shift_limit=30, p=0.5),
        A.GaussNoise(var_limit=(20.0, 50.0), p=0.4),
        A.Blur(blur_limit=(3, 7), p=0.4),
        A.Downscale(scale_min=0.7, scale_max=0.9, p=0.3),
    ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))
    
    augmentations = [light_aug, medium_aug]
    
    for split in splits:
        img_dir = output_path / "images" / split
        label_dir = output_path / "labels" / split
        
        if not img_dir.exists():
            continue
        
        # Znajdź wszystkie obrazy
        images = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.jpeg")) + list(img_dir.glob("*.png"))
                
        new_images = []
        new_labels = []
        
        # Dla każdego obrazu
        for img_path in tqdm(images, desc=f"   Augmentacja {split}"):
            image = cv2.imread(str(img_path))
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Wczytaj anotacje
            txt_path = label_dir / f"{img_path.stem}.txt"
            if not txt_path.exists():
                continue
                
            with open(txt_path, 'r') as f:
                bboxes = []
                class_labels = []
                for line in f:
                    parts = line.strip().split()
                    if len(parts) == 5:
                        class_id = int(parts[0])
                        if target_classes is None or class_id in target_classes:
                            bboxes.append([float(x) for x in parts[1:5]])
                            class_labels.append(class_id)
            
            if not bboxes:
                continue
            
            # Stwórz augmentowane wersje
            num_augmentations = augment_factor - 1
            
            for aug_idx in range(num_augmentations):
                if split == 'train':
                    aug_type = random.choice(augmentations)
                elif split == 'val':
                    aug_type = light_aug
                else:
                    continue
                
                # Zastosuj augmentację
                try:
                    augmented = aug_type(image=image, bboxes=bboxes, class_labels=class_labels)
                    
                    if len(augmented['bboxes']) == 0:
                        continue
                    
                    # Zapisz augmentowany obraz
                    aug_img_name = f"{img_path.stem}_aug{aug_idx + 1}{img_path.suffix}"
                    aug_img_path = img_dir / aug_img_name
                    cv2.imwrite(str(aug_img_path), cv2.cvtColor(augmented['image'], cv2.COLOR_RGB2BGR))
                    new_images.append(aug_img_path)
                    
                    # Zapisz augmentowane anotacje
                    aug_txt_path = label_dir / f"{img_path.stem}_aug{aug_idx + 1}.txt"
                    with open(aug_txt_path, 'w') as f:
                        for bbox, cls in zip(augmented['bboxes'], augmented['class_labels']):
                            f.write(f"{cls} {bbox[0]:.6f} {bbox[1]:.6f} {bbox[2]:.6f} {bbox[3]:.6f}\n")
                    new_labels.append(aug_txt_path)
                    
                except Exception as e:
                    print(f"Błąd augmentacji {img_path.name}: {e}")
                    continue
            
    print(f"\nAugmentowany dataset zapisany w: {output_path}")
    
    return output_path

def update_data_yaml(dataset_path, original_yaml="dataset_yolo2/data.yaml"):
    import yaml
    
    with open(original_yaml, 'r') as f:
        config = yaml.safe_load(f)
    
    # Zaktualizuj ścieżkę
    config['path'] = str(Path(dataset_path).absolute())
    
    # Zapisz nowy plik
    new_yaml = Path(dataset_path) / "data.yaml"
    with open(new_yaml, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
        
    return new_yaml

if __name__ == "__main__":
    SOURCE_DATASET = "dataset_yolo_biedra"
    AUGMENTED_DATASET = "dataset_yolo_biedra_augmented"
    AUGMENT_FACTOR = 2  # 2x więcej danych
    
    print(f"\nTworzenie augmentowanego datasetu.")
    augmented_path = create_augmented_dataset(
        source_folder=SOURCE_DATASET,
        output_folder=AUGMENTED_DATASET,
        augment_factor=AUGMENT_FACTOR
    )
    
    if augmented_path:
        new_yaml = update_data_yaml(augmented_path, f"{SOURCE_DATASET}/data.yaml")      

    print("AUGMENTACJA ZAKOŃCZONA!")