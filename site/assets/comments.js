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
    });
  });
}

window.addEventListener('DOMContentLoaded', () => initCommentForms());
