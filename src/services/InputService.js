/* global Phaser */
export default class InputService {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.gamepad = null;
    this.mobile = { left: false, right: false, jump: false };
    this.mobilePrevJump = false;

    // Listen for gamepad connection if plugin is available
    if (scene.input.gamepad) {
      scene.input.gamepad.once('connected', pad => {
        this.gamepad = pad;
      });
    }
  }

  setMobileInput(direction, isActive) {
    if (this.mobile.hasOwnProperty(direction)) {
      this.mobile[direction] = isActive;
    }
  }

  left() {
    const padLeft = this.gamepad && this.gamepad.left;
    return this.cursors.left.isDown || padLeft || this.mobile.left;
  }

  right() {
    const padRight = this.gamepad && this.gamepad.right;
    return this.cursors.right.isDown || padRight || this.mobile.right;
  }

  hasControlInput() {
    const keyboardLeft = this.cursors.left?.isDown;
    const keyboardRight = this.cursors.right?.isDown;
    const keyboardUp = this.cursors.up?.isDown;
    const keyboardSpace = this.cursors.space?.isDown;

    const padLeft = this.gamepad?.left?.pressed;
    const padRight = this.gamepad?.right?.pressed;
    const padUp = this.gamepad?.up?.pressed;
    const padA = this.gamepad?.A?.pressed;
    const padB = this.gamepad?.B?.pressed;

    return (
      keyboardLeft ||
      keyboardRight ||
      keyboardUp ||
      keyboardSpace ||
      padLeft ||
      padRight ||
      padUp ||
      padA ||
      padB ||
      this.mobile.left ||
      this.mobile.right ||
      this.mobile.jump
    );
  }

  upJustPressed() {
    const keyboardUp = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const padUp =
      this.gamepad &&
      this.gamepad.A &&
      Phaser.Input.Gamepad.JustDown(this.gamepad.A);
    const mobileJump = this.mobile.jump && !this.mobilePrevJump;
    this.mobilePrevJump = this.mobile.jump;
    return keyboardUp || padUp || mobileJump;
  }

  jumpJustPressed() {
    return this.upJustPressed();
  }
}
