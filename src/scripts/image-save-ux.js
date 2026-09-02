// Shared image save UX for browser-generated images.
// Keeps the original Blob untouched (including PNG alpha) and only changes the save flow.
export function isAppleMobile() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function saveImageBlob(blob, filename, options = {}) {
  const apple = isAppleMobile();
  const file = new File([blob], filename, { type: blob.type || 'image/png' });

  // On iPhone/iPad, prefer the native share sheet so the user can choose
  // “Save Image / Save to Photos”. This must be called from a user gesture.
  if (apple && navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: options.title || filename });
        return { method: 'share' };
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return { method: 'cancelled' };
      // Fall through to the image-preview/download fallback.
    }
  }

  const url = URL.createObjectURL(blob);
  if (apple) {
    openAppleSaveSheet(url, filename, options);
    return { method: 'preview' };
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return { method: 'download' };
}

function openAppleSaveSheet(url, filename, options) {
  const old = document.getElementById('image-save-ux-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'image-save-ux-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="isu-backdrop"></div>
    <div class="isu-card">
      <button class="isu-close" type="button" aria-label="閉じる">×</button>
      <h2>${escapeHtml(options.heading || 'iPhoneに画像を保存')}</h2>
      <p class="isu-lead">画像を長押しして「写真に保存」または「写真に追加」を選んでください。</p>
      ${options.pokekara ? '<p class="isu-pokekara">ポケカラで使う場合は「写真」に保存すると、そのまま写真ライブラリから選べます。</p>' : ''}
      <img class="isu-image" src="${url}" alt="保存する画像" />
      <a class="isu-file" href="${url}" download="${escapeHtml(filename)}">うまくいかない場合：ファイルとして保存</a>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `#image-save-ux-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:16px}.isu-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.72)}.isu-card{position:relative;width:min(560px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;padding:20px;text-align:center;box-shadow:0 20px 70px rgba(0,0,0,.35)}.isu-close{position:absolute;right:10px;top:8px;border:0;background:transparent;font-size:30px;line-height:1;cursor:pointer}.isu-card h2{font-size:20px;margin:4px 34px 8px}.isu-lead{font-size:13px;line-height:1.7;margin:0 0 10px}.isu-pokekara{background:#f5f3ee;border-radius:12px;padding:10px;font-size:12px;line-height:1.6}.isu-image{display:block;max-width:100%;max-height:58vh;margin:14px auto;object-fit:contain}.isu-file{display:block;padding:13px;border:1px solid #bbb;border-radius:12px;color:#222;text-decoration:none;font-size:12px;font-weight:700}`;
  modal.appendChild(style);
  document.body.appendChild(modal);
  const close = () => { modal.remove(); URL.revokeObjectURL(url); };
  modal.querySelector('.isu-close').onclick = close;
  modal.querySelector('.isu-backdrop').onclick = close;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
