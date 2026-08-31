export const QR_ANIMAL_IDS = ["cat","dog","rabbit","bear","panda","chick","fox","penguin","koala","hedgehog","hamster"] as const;
export type QrAnimalId = (typeof QR_ANIMAL_IDS)[number];

const POS: Record<QrAnimalId,[number,number]> = {
  cat:[0,0],dog:[96,0],rabbit:[192,0],bear:[288,0],
  panda:[0,96],chick:[96,96],fox:[192,96],penguin:[288,96],
  koala:[0,192],hedgehog:[96,192],hamster:[192,192],
};

export function renderQrAnimalSvg(id:QrAnimalId,_foreground="#342f33",_background="#ffffff"){
  const [x,y]=POS[id];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" aria-hidden="true"><image href="/qr-animals-sprite.png" x="${-x}" y="${-y}" width="384" height="288"/></svg>`;
}
