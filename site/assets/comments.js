function clearErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
    el.classList.remove('field-error--visible');
  });
  form.querySelectorAll('.input-invalid').forEach((el) => el.classList.remove('input-invalid'));
}

function setStatus(form, message, asHtml = false) {
  const status = form.querySelector('[data-comment-status]');
  if (!status) return;

  if (asHtml) {
    status.innerHTML = message;
    return;
  }

  status.textContent = message;
}

function showError(form, fieldName, message) {
  const error = form.querySelector(`[data-error-for="${fieldName}"]`);
  if (error) {
    error.textContent = message;
    error.classList.add('field-error--visible');
  }
  const target = form.querySelector(`[name="${fieldName}"]`);
  if (target) {
    target.classList.add('input-invalid');
  }
}

function validate(form) {
  const honeypot = form.querySelector('[data-honeypot]');
  const intent = form.querySelector('input[name="intent"]:checked');
  const name = form.querySelector('input[name="name"]');
  const body = form.querySelector('textarea[name="comment"]');

  clearErrors(form);

  if (honeypot && honeypot.value.trim().length) {
    showError(form, 'intent', 'Please try again.');
    setStatus(form, 'Submission blocked. If this is unexpected, refresh and try once more.');
    return false;
  }

  let valid = true;

  if (!intent) {
    valid = false;
    showError(form, 'intent', 'Choose Minor or Major so we can route your note.');
  }

  if (!name || !name.value.trim()) {
    valid = false;
    showError(form, 'name', 'Add your name or handle so we can attribute credit.');
  }

  if (!body || !body.value.trim()) {
    valid = false;
    showError(form, 'comment', 'Share a short note so we know what to change.');
  } else if (body.value.trim().length < 10) {
    valid = false;
    showError(form, 'comment', 'A few more details will help us review your suggestion.');
  }

  if (!valid) {
    setStatus(form, 'Please fix the highlighted fields.');
    return false;
  }

  setStatus(form, 'Preparing a prefilled GitHub issue…');
  return true;
}

function serializeForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function buildIssueFallbackUrl(form) {
  const base = form.dataset.commentIssueFallback || '';
  if (!base) return '';

  const payload = serializeForm(form);
  const title = `[Comment] ${payload.slug || 'essay'} · ${payload.intent || 'feedback'}`;
  const body = [
    `Essay slug: ${payload.slug || ''}`,
    `Essay title: ${payload.essayTitle || ''}`,
    `Essay URL: ${payload.essayUrl || ''}`,
    `Intent: ${payload.intent || ''}`,
    `Name: ${payload.name || ''}`,
    `Public contact: ${payload.contact || ''}`,
    '',
    'Comment:',
    payload.comment || '',
  ].join('\n');

  try {
    const fallback = new URL(base);
    fallback.searchParams.set('title', title);
    fallback.searchParams.set('body', body);
    return fallback.toString();
  } catch (error) {
    return '';
  }
}

function openIssue(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  const issueFallbackUrl = buildIssueFallbackUrl(form);

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    if (!issueFallbackUrl) {
      setStatus(form, 'GitHub issue comments are not configured yet. Please use the repository contact route.');
      return;
    }

    const opened = window.open(issueFallbackUrl, '_blank', 'noopener,noreferrer');
    const link = `<a href="${issueFallbackUrl}" target="_blank" rel="noopener noreferrer">Open the prefilled GitHub issue</a>`;

    if (opened) {
      setStatus(form, `A prefilled GitHub issue opened in a new tab. If you do not see it, ${link}.`, true);
      return;
    }

    setStatus(form, `Your browser blocked the new tab. ${link}.`, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

export function initCommentForms(root = document) {
  const forms = root.querySelectorAll('[data-comment-form]');
  forms.forEach((form) => {
    const intentInputs = form.querySelectorAll('input[name="intent"]');
    intentInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label) {
          setStatus(form, `${label.dataset.intentLabel} selected. Add your note below, then open a prefilled GitHub issue.`);
        }
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const isValid = validate(form);
      if (!isValid) {
        return;
      }

      openIssue(form);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => initCommentForms());
