const coarseMedia = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;

const addCoarseListener = handler => {
  if (!coarseMedia || !handler) return;
  if (coarseMedia.addEventListener) {
    coarseMedia.addEventListener('change', handler);
  } else if (coarseMedia.addListener) {
    coarseMedia.addListener(handler);
  }
};

const removeCoarseListener = handler => {
  if (!coarseMedia || !handler) return;
  if (coarseMedia.removeEventListener) {
    coarseMedia.removeEventListener('change', handler);
  } else if (coarseMedia.removeListener) {
    coarseMedia.removeListener(handler);
  }
};

const shouldEnableControls = () => {
  const coarse = coarseMedia?.matches;
  if (coarse) return true;
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  return width > 0 && width <= 1024;
};

const stopEvent = event => {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
};

export default class MobileControls {
  constructor(scene, inputService) {
    this.scene = scene;
    this.inputService = inputService;
    this.container = document.getElementById('game-container') || document.body;
    this.root = document.createElement('div');
    this.root.className = 'mobile-controls';
    this.root.setAttribute('aria-hidden', 'true');

    this._buttons = {};
    this._active = { left: false, right: false, jump: false };

    this._createLayout();

    this.updateVisibility = this.updateVisibility.bind(this);
    this.destroy = this.destroy.bind(this);

    this.container.appendChild(this.root);
    this.updateVisibility();

    window.addEventListener('resize', this.updateVisibility);
    addCoarseListener(this.updateVisibility);

    scene.events.once('shutdown', this.destroy);
    scene.events.once('destroy', this.destroy);
  }

  _createLayout() {
    const dpad = document.createElement('div');
    dpad.className = 'mobile-controls__cluster mobile-controls__cluster--dpad';

    const jumpCluster = document.createElement('div');
    jumpCluster.className = 'mobile-controls__cluster';

    this.root.appendChild(dpad);
    this.root.appendChild(jumpCluster);

    this._buttons.left = this._createButton('◀', 'left', dpad);
    this._buttons.right = this._createButton('▶', 'right', dpad);
    this._buttons.jump = this._createButton('⤒', 'jump', jumpCluster);
  }

  _createButton(label, direction, parent) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mobile-controls__button';
    const ariaLabel =
      direction === 'jump'
        ? 'Jump'
        : direction === 'left'
        ? 'Move left'
        : direction === 'right'
        ? 'Move right'
        : direction;
    btn.setAttribute('aria-label', ariaLabel);
    btn.textContent = label;
    btn.setAttribute('aria-pressed', 'false');

    const handlePress = event => {
      stopEvent(event);
      if (event?.pointerId != null && btn.setPointerCapture) {
        try {
          btn.setPointerCapture(event.pointerId);
        } catch (err) {
          // ignore capture errors
        }
      }
      this._setActive(direction, true);
    };

    const releasePointer = event => {
      if (event?.pointerId != null && btn.releasePointerCapture) {
        try {
          btn.releasePointerCapture(event.pointerId);
        } catch (err) {
          // ignore release errors
        }
      }
    };

    const handleRelease = event => {
      stopEvent(event);
      releasePointer(event);
      this._setActive(direction, false);
    };

    const handleLeave = event => {
      stopEvent(event);
      releasePointer(event);
      this._setActive(direction, false);
    };

    btn.addEventListener('pointerdown', handlePress);
    btn.addEventListener('pointerup', handleRelease);
    btn.addEventListener('pointercancel', handleLeave);
    btn.addEventListener('pointerout', handleLeave);
    btn.addEventListener('touchstart', handlePress, { passive: false });
    btn.addEventListener('touchend', handleRelease, { passive: false });
    btn.addEventListener('touchcancel', handleLeave, { passive: false });
    btn.addEventListener('contextmenu', stopEvent);

    parent.appendChild(btn);
    return btn;
  }

  _setActive(direction, isActive) {
    if (!this._buttons[direction]) return;
    if (this._active[direction] === isActive) return;
    this._active[direction] = isActive;
    this._buttons[direction].dataset.active = String(isActive);
    this._buttons[direction].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    this.inputService.setMobileInput(direction, isActive);
  }

  updateVisibility() {
    if (!this.root) return;
    const visible = shouldEnableControls();
    this.root.classList.toggle('mobile-controls--visible', visible);
    this.root.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (!visible) {
      this._resetInputs();
    }
  }

  _resetInputs() {
    Object.keys(this._active).forEach(direction => this._setActive(direction, false));
  }

  destroy() {
    if (!this.root) return;
    this._resetInputs();
    window.removeEventListener('resize', this.updateVisibility);
    removeCoarseListener(this.updateVisibility);
    if (this.root?.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
    this.root = null;
    this.scene = null;
  }
}
