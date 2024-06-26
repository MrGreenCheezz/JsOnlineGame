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
    this.setActive(true);
    this.setVisible(true);
    this.setScale(0.02);
 }

 fire(x: number, y: number, speed: number){

     this.setVelocity(x * speed, y * speed);
     this.setRotation(Math.atan2(y,x) - 1.57);
 }
}

export default Bullet;