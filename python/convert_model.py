import torch
from ultralytics import YOLO

model = YOLO('runs/detect/runs/train/biedra_SGD_0.001/weights/best.pt')

model.export(
    format='executorch',
    imgsz=640,
    half=False,
)

print("Model skonwertowany do best.pte")