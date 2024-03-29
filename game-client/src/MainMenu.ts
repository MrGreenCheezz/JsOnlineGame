import Phaser from "phaser";


class MainMenu {

    private startButton!: Phaser.GameObjects.Text;
    private inputText!: Phaser.GameObjects.DOMElement;
    private menuContainer!: Phaser.GameObjects.Container;
    private isVisible: boolean = true;
    private inputBackground!: Phaser.GameObjects.Rectangle;
    constructor(scene: Phaser.Scene) {
        const centerX = scene.cameras.main.width / 2;
        const centerY = scene.cameras.main.height / 2;


       
        // Создаем графический объект для фонового прямоугольника с закругленными углами
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x87CEEB, 1);
        graphics.fillRoundedRect(centerX - 175, centerY - 100, 350, 200, 20);

        // Создаем кнопку старт
        const buttonStyle = { font: '24px Arial', backgroundColor: '#000000', padding: { left: 10, right: 10, top: 10, bottom: 5 } };
        this.startButton = scene.add.text(centerX, centerY + 40, 'Старт', buttonStyle)
            .setOrigin(0.5, 0.5)
            .setInteractive();

        // Создаем контейнер для меню и добавляем в него все элементы
        this.menuContainer = scene.add.container(0, 0);
        this.menuContainer.add([graphics, this.startButton]);

        // Обработчик нажатия на кнопку старт
        this.startButton.on('pointerdown', () => {
            const playerName = (document.querySelector('input[name="name"]') as HTMLInputElement).value;
            console.log('Игрок:', playerName);
        });

    }

    toggleMenuVisibility() {
        this.isVisible = !this.isVisible;
        this.menuContainer.setVisible(this.isVisible);
    }
} export { MainMenu };