import Phaser from 'phaser';

class HealthBar {
    private bar: Phaser.GameObjects.Graphics;
    private x: number;
    private y: number;
    private value: number;
    private maxValue: number;
    private barWidth: number;
    private barHeight: number;
    private playerName: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, maxValue: number, barWidth: number = 75, barHeight: number = 15, name: string = "Player") {
        this.bar = scene.add.graphics();
        this.x = x;
        this.y = y;
        this.value = maxValue;
        this.maxValue = maxValue;
        this.barWidth = barWidth;
        this.barHeight = barHeight;
        this.playerName = scene.add.text(100, 100, name, { font: '15px Arial', color: '#ffffff', stroke: '#000000', strokeThickness: 2 });
        const maxWidth = 75; // максимальная ширина
        const maxHeight = 200; // максимальная высота

        // Проверяем, нужно ли масштабировать текст по ширине
        if (this.playerName.width > maxWidth) {
            this.playerName.setScale(maxWidth / this.playerName.width);
        }

        // Проверяем, нужно ли масштабировать текст по высоте
        if (this.playerName.height > maxHeight) {
            this.playerName.setScale(Math.min(this.playerName.scaleX, maxHeight / this.playerName.height));
        }
        console.log(name);
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
    public Move(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.playerName.x = this.x;
        this.playerName.y = this.y - 15;
        this.draw();
    }

    public destroy() {
        this.playerName.destroy();
        this.bar.destroy();
    }
}

export default HealthBar;