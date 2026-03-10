function clearErrors(form) {
  form.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
    el.classList.remove('field-error--visible');
  });
  form.querySelectorAll('.input-invalid').forEach((el) => el.classList.remove('input-invalid'));
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
  const status = form.querySelector('[data-comment-status]');
  const honeypot = form.querySelector('[data-honeypot]');
  const intent = form.querySelector('input[name="intent"]:checked');
  const name = form.querySelector('input[name="name"]');
  const body = form.querySelector('textarea[name="comment"]');

  clearErrors(form);

  if (honeypot && honeypot.value.trim().length) {
    showError(form, 'intent', 'Please try again.');
    status.textContent = 'Submission blocked. If this is unexpected, refresh and try once more.';
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
    status.textContent = 'Please fix the highlighted fields.';
    return false;
  }

  status.textContent = 'Sending feedback…';
  return true;
}

function serializeForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

async function submit(form, endpoint) {
  const status = form.querySelector('[data-comment-status]');
  const submitButton = form.querySelector('button[type="submit"]');

  const payload = serializeForm(form);

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};
    const success = data && data.success;

    if (!response.ok || !success) {
      const message =
        (data && data.message) ||
        (data && data.errors && data.errors.join(' ')) ||
        (response.status === 404
          ? 'Comment endpoint is unavailable. Configure COMMENTS_ENDPOINT to a deployed serverless route.'
          : 'Unable to send feedback right now. Please try again later.');
      throw new Error(message);
    }

    status.textContent = data.message || 'Thanks for sharing feedback. We will review it soon.';
    form.reset();
  } catch (error) {
    status.textContent = error.message || 'Unable to send feedback right now. Please try again later.';
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

export function initCommentForms(root = document) {
  const forms = root.querySelectorAll('[data-comment-form]');
  forms.forEach((form) => {
    const status = form.querySelector('[data-comment-status]');
    const endpoint = form.dataset.commentEndpoint || '';

    const intentInputs = form.querySelectorAll('input[name="intent"]');
    intentInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label && status) {
          status.textContent = `${label.dataset.intentLabel} selected. Add your note below.`;
        }
      });
    });

    form.addEventListener('submit', (event) => {
      const isValid = validate(form);
      if (!isValid) {
        event.preventDefault();
        return;
      }

      if (!endpoint) {
        event.preventDefault();
        status.textContent = 'Submission endpoint is not configured yet. Use the discussion thread below to leave your note.';
        return;
      }

      event.preventDefault();
      submit(form, endpoint);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => initCommentForms());
