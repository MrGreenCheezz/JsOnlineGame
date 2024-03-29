import Phaser from 'phaser';

class HealthBar {
    private bar: Phaser.GameObjects.Graphics;
    private x: number;
    private y: number;
    private value: number;
    private maxValue: number;
    private barWidth: number;
    private barHeight: number;

    constructor(scene: Phaser.Scene, x: number, y: number, maxValue: number, barWidth: number = 75, barHeight: number = 10) {
        this.bar = scene.add.graphics();
        this.x = x;
        this.y = y;
        this.value = maxValue;
        this.maxValue = maxValue;
        this.barWidth = barWidth;
        this.barHeight = barHeight;

        this.draw();
    }

    private draw() {
        // Очистим старое отображение
        this.bar.clear();

        // Рисуем фон полоски здоровья
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x, this.y, this.barWidth, this.barHeight);

        // Рассчитаем ширину зеленой части полоски
        const healthWidth = Math.floor(this.value / this.maxValue * this.barWidth);

        // Рисуем зеленую часть полоски
        this.bar.fillStyle(0x00ff00);
        this.bar.fillRect(this.x, this.y, healthWidth, this.barHeight);
    }

    public setValue(newValue: number) {
        this.value = newValue;
        if (this.value < 0) {
            this.value = 0;
        } else if (this.value > this.maxValue) {
            this.value = this.maxValue;
        }
        this.draw();
    }

    public decrease(amount: number) {
        this.setValue(this.value - amount);
    }

    public increase(amount: number) {
        this.setValue(this.value + amount);
    }
    public Move(x: number, y: number){
        this.x = x;
        this.y = y;
        this.draw();
    }

    public destroy() {
        this.bar.destroy();
    }
}

export default HealthBar;