export interface MouseDragEvent extends MouseEvent {
    startX: number;
    startY: number;
    distX?: number;
    distY?: number;
}
