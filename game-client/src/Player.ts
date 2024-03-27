import Phaser from "phaser";
import {MyGame} from "./main.ts";

class Player extends Phaser.Physics.Arcade.Sprite
{
 Owner : string = "";
 public Health : number = 100;
 constructor(scene: MyGame, x: number | undefined = 0, y: number | undefined = 0, texture: string, owner: string){  
    super(scene, x, y, texture);
    this.Owner = owner;
    scene.add.existing(this);
    this.setScale(0.1);
    //scene.physics.add.existing(this);
    scene.playersGroup?.add(this);
 }


}

export default Player;