import Phaser from "phaser";
import {MyGame} from "./main.ts";

class Bullet extends Phaser.Physics.Arcade.Sprite
{
 Owner : string = "";
 constructor(scene: MyGame, x: number | undefined = 0, y: number | undefined = 0, texture: string, owner: string){  
    super(scene, x, y, texture);
    this.Owner = owner;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.bulletsGroup?.add(this);
 }

 fire(x: number, y: number, speed: number){
     this.setActive(true);
     this.setVisible(true);
     this.setVelocity(x * speed, y * speed);
 }
}

export default Bullet;