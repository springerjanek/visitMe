import os
import yaml
from pathlib import Path
from ultralytics import YOLO
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime
import seaborn as sns

def train_yolo_model(data_yaml="dataset_yolo/data.yaml",  
                     model_name="yolov8n.pt",
                     epochs=100,
                     imgsz=640,
                     batch_size=8,
                     device="mps"):

    if not Path(data_yaml).exists():
        print(f"Plik {data_yaml} nie istnieje!")
        return
    
    print("=" * 60)
    print("ROZPOCZYNAM TRENOWANIE")
    print("=" * 60)

    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    experiment_name = f"biedra_detector_{timestamp}"
    
    print(f"\nRozpoczynam trening...")

    model = YOLO(model_name)
    results = model.train(
        data=data_yaml,
        epochs=100,
        imgsz=imgsz,
        batch=batch_size,
        lr0=0.001,
        device=device,
        patience=20,  # Early stopping po 20 epokach bez poprawy
        save=True,
        project="runs/train",
        name=experiment_name,
        exist_ok=True,
        pretrained=True,
        optimizer='AdamW',
        verbose=True,
        seed=42,
        plots=True,
    )
    
    print(f"\nTrening zakończony!")
    print(f"Wyniki zapisane w: runs/train/{experiment_name}")
    
    return results, experiment_name

def plot_training_metrics_simple(experiment_name="zabka_detector", results_dir="runs/detect/runs/train"):    
    results_path = Path(results_dir) / experiment_name
    
    if not results_path.exists():
        print(f"❌ Folder {results_path} nie istnieje!")
        return None
    
    csv_file = results_path / "results.csv"
    
    if not csv_file.exists():
        print(f"❌ Plik {csv_file} nie istnieje!")
        print("   Upewnij się, że trening został ukończony")
        return None
    
    df = pd.read_csv(csv_file)
    df.columns = df.columns.str.strip()
    
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
    fig.suptitle(f'Wyniki trenowania modelu YOLO - {experiment_name}', fontsize=14, fontweight='bold')
    
    epochs = df['epoch']
    
    # ============================================
    # WYKRES 1: STRATY (LOSS) - TREning i walidacja
    # ============================================
    train_total_loss = df['train/box_loss'] + df['train/cls_loss'] + df['train/dfl_loss']
    val_total_loss = df['val/box_loss'] + df['val/cls_loss'] + df['val/dfl_loss']
    
    ax1.plot(epochs, train_total_loss, label='Trening (Training Loss)', linewidth=2, color='blue')
    ax1.plot(epochs, val_total_loss, label='Walidacja (Validation Loss)', linewidth=2, color='red', linestyle='--')
    ax1.set_xlabel('Epoka (Epoch)')
    ax1.set_ylabel('Strata (Loss)')
    ax1.set_title('Krzywa uczenia - spadek straty w czasie')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Dodanie adnotacji - gdzie model przestał się uczyć
    min_val_loss_idx = val_total_loss.idxmin()
    min_val_loss = val_total_loss.min()
    ax1.plot(min_val_loss_idx, min_val_loss, 'ro', markersize=8)
    ax1.annotate(f'Najlepszy model\nEpoka {min_val_loss_idx}', 
                 xy=(min_val_loss_idx, min_val_loss),
                 xytext=(min_val_loss_idx + 10, min_val_loss + 0.5),
                 arrowprops=dict(arrowstyle='->', color='red'),
                 fontsize=9)
    
    # ============================================
    # WYKRES 2: DOKŁADNOŚĆ (ACCURACY) - mAP
    # ============================================
    ax2.plot(epochs, df['metrics/mAP50(B)'], label='mAP@0.5', linewidth=2, color='green')
    ax2.plot(epochs, df['metrics/mAP50-95(B)'], label='mAP@0.5:0.95', linewidth=2, color='orange', linestyle='--')
    ax2.set_xlabel('Epoka (Epoch)')
    ax2.set_ylabel('Dokładność (mAP)')
    ax2.set_title('Dokładność detekcji - wzrost w czasie')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    ax2.set_ylim([0, 1])
    
    # Dodanie adnotacji - najlepsza dokładność
    best_map50_idx = df['metrics/mAP50(B)'].idxmax()
    best_map50 = df['metrics/mAP50(B)'].max()
    ax2.plot(best_map50_idx, best_map50, 'go', markersize=8)
    ax2.annotate(f'Najlepsza dokładność\nEpoka {best_map50_idx}\nmAP@0.5 = {best_map50:.3f}', 
                 xy=(best_map50_idx, best_map50),
                 xytext=(best_map50_idx + 10, best_map50 - 0.15),
                 arrowprops=dict(arrowstyle='->', color='green'),
                 fontsize=9)
    
    plt.tight_layout()
    
    plot_path = results_path / "training_loss_accuracy.png"
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"Zapisano wykres: {plot_path}")       
    
    return df

def evaluate_model(model_path, data_yaml="dataset_yolo/data.yaml", conf_threshold=0.25):
    print("\n" + "=" * 60)
    print("EWALUACJA MODELU NA ZBIORZE TESTOWYM")
    print("=" * 60)
    
    model = YOLO(model_path)
    
    results = model.val(
        data=data_yaml,
        conf=conf_threshold,
        batch=8,
        device="mps",
        plots=True,
        save_json=True
    )
    return results

if __name__ == "__main__":
    DATA_YAML = "dataset_yolo_biedra_augmented/data.yaml"
    
    import torch
    if torch.backends.mps.is_available():
        device = "mps"
        print("Używam Apple Silicon (MPS)")
    else:
        device = "cpu"
        print("Używam CPU (MPS niedostępne)")
    
    print("\n" + "🔴" * 30)
    print("ROZPOCZYNAM TRENOWANIE")
    print("🔴" * 30)
    
    results, experiment_name = train_yolo_model(
        data_yaml=DATA_YAML,
        model_name="yolov8n.pt",
        epochs=100,
        imgsz=640,
        batch_size=8,
        device=device
    )
    
    print("\n" + "🟢" * 30)
    print("GENERUJĘ WYKRESY")
    print("🟢" * 30)
    
    df = plot_training_metrics_simple(experiment_name)
    
   # Ewaluacja na zbiorze testowym
    best_model_path = Path(f"runs/detect/runs/train/{experiment_name}/weights/best.pt")
    if best_model_path.exists():
        evaluate_model(str(best_model_path), DATA_YAML)
    else:
        print("⚠️ Nie znaleziono najlepszego modelu do ewaluacji")
    
    #podsumowanie
    summary_path = Path(f"runs/detect/runs/train/{experiment_name}/training_summary.txt")
    with open(summary_path, 'w') as f:
        f.write(f"Eksperyment: {experiment_name}\n")
        f.write(f"Plik danych: {DATA_YAML}\n")
        f.write("-" * 40 + "\n")
        
        if df is not None:
            best_epoch = df['metrics/mAP50(B)'].idxmax()
            f.write(f"mAP50: {df['metrics/mAP50(B)'].max():.4f}\n")
            f.write(f"mAP50-95: {df['metrics/mAP50-95(B)'].max():.4f}\n")
            f.write(f"Precision: {df['metrics/precision(B)'].max():.4f}\n")
            f.write(f"Recall: {df['metrics/recall(B)'].max():.4f}\n")