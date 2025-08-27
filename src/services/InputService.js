export default class InputService {
  constructor(scene) {
    this.scene = scene;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.gamepad = null;
    this.mobile = { left: false, right: false, jump: false };
    this.mobilePrevJump = false;

    // Listen for gamepad connection
    scene.input.gamepad.once('connected', pad => {
      this.gamepad = pad;
    });
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

  jumpJustPressed() {
    const keyboardJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const padJump =
      this.gamepad &&
      this.gamepad.A &&
      Phaser.Input.Gamepad.JustDown(this.gamepad.A);
    const mobileJump = this.mobile.jump && !this.mobilePrevJump;
    this.mobilePrevJump = this.mobile.jump;
    return keyboardJump || padJump || mobileJump;
  }
}
