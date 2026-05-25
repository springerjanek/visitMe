import os
import shutil
import random
from pathlib import Path
from sklearn.model_selection import train_test_split

def clean_and_split_dataset(source_folder="zabka_obrazy", output_folder="dataset_yolo"):
    source_path = Path(source_folder)
    output_path = Path(output_folder)
    
    if not source_path.exists():
        print(f"Folder {source_folder} nie istnieje!")
        return
    
    # 1. Znajdź wszystkie pliki jpg i txt
    print(f"Przetwarzanie folderu: {source_folder}")
    
    all_jpg = list(source_path.glob("*.jpg")) + list(source_path.glob("*.jpeg")) + list(source_path.glob("*.png"))
    all_txt = list(source_path.glob("*.txt"))
    
    print(f"Znaleziono: {len(all_jpg)} plików obrazów, {len(all_txt)} plików txt")
    
    images_to_remove = []
    images_with_annotation = []
    matched_pairs = []
        
    for img in all_jpg:
        img_stem = img.stem
        
        found_txt = None
        
        possible_patterns = [
            f"{img_stem}.txt",           # standard: obraz.jpg.txt
            f"{img_stem}.xml.txt",       # twoja sytuacja: obraz.jpg.xml.txt
            f"{img_stem}.xml",           # obraz.jpg.xml
            f"{img.name}.txt",           # obraz.jpg.txt
            f"{img.name}.xml.txt",       # obraz.jpg.xml.txt
            f"{img_stem}_annotations.txt", # obraz_annotations.txt
        ]
        
        for pattern in possible_patterns:
            potential_txt = source_path / pattern
            if potential_txt in all_txt:
                found_txt = potential_txt
                break
        
        if not found_txt:
            # Szukaj txt który zawiera nazwę obrazu (bez rozszerzenia)
            for txt in all_txt:
                if img_stem in txt.stem:
                    found_txt = txt
                    break
        
        if found_txt:
            images_with_annotation.append(img)
            matched_pairs.append((img, found_txt))
        else:
            images_to_remove.append(img)
            print(f"   Brak anotacji dla: {img.name}")
    
    deleted_folder = source_path / "_usuniete_bez_anotacji"
    if images_to_remove:
        deleted_folder.mkdir(exist_ok=True)
        print(f"\n📁 Przenoszenie obrazów bez anotacji: {len(images_to_remove)} plików")
        
        for img in images_to_remove:
            shutil.move(str(img), str(deleted_folder / img.name))
            print(f"   ⚠️ Przeniesiono do: {deleted_folder.name}/{img.name}")
    
    print(f"\nPozostało: {len(images_with_annotation)} obrazów z anotacjami")
    
    if len(images_with_annotation) == 0:
        return
    
    print(f"\nPodział danych:")
    print("-" * 60)
    
    # Najpierw podziel na train (80%) i temp (20%)
    train_pairs, temp_pairs = train_test_split(
        matched_pairs, 
        test_size=0.2, 
        random_state=42
    )
    
    # Podziel temp na val (50% z 20% = 10%) i test (50% z 20% = 10%)
    val_pairs, test_pairs = train_test_split(
        temp_pairs, 
        test_size=0.5, 
        random_state=42
    )
    
    print(f"TRAIN: {len(train_pairs)} obrazów ({len(train_pairs)/len(matched_pairs)*100:.1f}%)")
    print(f"VAL:   {len(val_pairs)} obrazów ({len(val_pairs)/len(matched_pairs)*100:.1f}%)")
    print(f"TEST:  {len(test_pairs)} obrazów ({len(test_pairs)/len(matched_pairs)*100:.1f}%)")
    
    print(f"\nTworzenie struktury folderów:")
    print("-" * 60)
    
    # Foldery dla obrazów
    train_img_dir = output_path / "images" / "train"
    val_img_dir = output_path / "images" / "val"
    test_img_dir = output_path / "images" / "test"
    
    # Foldery dla anotacji
    train_label_dir = output_path / "labels" / "train"
    val_label_dir = output_path / "labels" / "val"
    test_label_dir = output_path / "labels" / "test"
    
    # Utwórz foldery
    for dir_path in [train_img_dir, val_img_dir, test_img_dir, 
                     train_label_dir, val_label_dir, test_label_dir]:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"Utworzono: {dir_path.relative_to(output_path)}")
    
    def copy_files(pairs, split_name):
        img_copied = 0
        txt_copied = 0
        
        for img, txt_file in pairs:
            # Kopiuj obraz
            dest_img = output_path / "images" / split_name / img.name
            shutil.copy2(img, dest_img)
            img_copied += 1
            
            # Kopiuj plik txt (zachowaj oryginalną nazwę lub zmień na standardową)
            if txt_file.exists():
                # Opcja 1: Zachowaj oryginalną nazwę
                # dest_txt = output_path / "labels" / split_name / txt_file.name
                
                # Opcja 2: Zmień nazwę na standardową (bez .xml)
                standard_txt_name = f"{img.stem}.txt"
                dest_txt = output_path / "labels" / split_name / standard_txt_name
                
                shutil.copy2(txt_file, dest_txt)
                txt_copied += 1
                
                if txt_file.name != standard_txt_name:
                    print(f"Zmieniono nazwę: {txt_file.name} -> {standard_txt_name}")
            else:
                print(f"Brak pliku txt dla: {img.name}")
        
        return img_copied, txt_copied
    
    # Kopiuj pliki dla każdego zbioru
    train_imgs_copied, train_txt_copied = copy_files(train_pairs, "train")
    val_imgs_copied, val_txt_copied = copy_files(val_pairs, "val")
    test_imgs_copied, test_txt_copied = copy_files(test_pairs, "test")
    
    print(f"\nTworzenie pliku data.yaml:")
    print("-" * 60)
    
    yaml_content = f"""
# Dataset dla detekcji logo Biedronki
path: {output_path.absolute()}
train: images/train
val: images/val
test: images/test

nc: 1  # liczba klas
names: ['biedronka']  # nazwy klas
"""
    
    yaml_file = output_path / "data.yaml"
    with open(yaml_file, 'w', encoding='utf-8') as f:
        f.write(yaml_content.strip())
        
    print("\n" + "=" * 60)
    print("PODSUMOWANIE:")
    print("=" * 60)
    print(f"\nOczyszczono: przeniesiono {len(images_to_remove)} obrazów bez anotacji do folderu '_usuniete_bez_anotacji'")
    print(f"Pary obraz-anotacja: {len(matched_pairs)}")
    print(f"\n📂 Lokalizacja datasetu: {output_path.absolute()}")

    return output_path

def verify_dataset(dataset_path):
    
    dataset_path = Path(dataset_path)
    
    splits = ['train', 'val', 'test']
    
    for split in splits:
        img_dir = dataset_path / "images" / split
        label_dir = dataset_path / "labels" / split
        
        if not img_dir.exists():
            print(f"Brak folderu: {img_dir}")
            continue
            
        images = list(img_dir.glob("*.jpg")) + list(img_dir.glob("*.jpeg")) + list(img_dir.glob("*.png"))
        labels = list(label_dir.glob("*.txt"))
        
        print(f"\n{split.upper()}:")
        print(f"   Obrazy: {len(images)}")
        print(f"   Anotacje: {len(labels)}")
        
        # Sprawdź czy każdy obraz ma odpowiadającą anotację
        missing_labels = []
        for img in images:
            label_file = label_dir / f"{img.stem}.txt"
            if not label_file.exists():
                missing_labels.append(img.name)
        
        if missing_labels:
            print(f"Brakujące anotacje: {len(missing_labels)}")
            for name in missing_labels[:5]:
                print(f"      - {name}")
        else:
            print(f"Wszystkie obrazy mają anotacje")

if __name__ == "__main__":
    dataset_dir = clean_and_split_dataset(
        source_folder="biedronka_obrazy3",
        output_folder="dataset_yolo_biedra3"
    )
    
    if dataset_dir:
        verify_dataset(dataset_dir)
        print("Gotowe!")
   