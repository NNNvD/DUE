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

  setStatus(form, 'Sending feedback…');
  return true;
}

function serializeForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function toAbsoluteEndpoint(endpoint) {
  if (!endpoint) return '';
  try {
    return new URL(endpoint, window.location.origin).toString();
  } catch (error) {
    return endpoint;
  }
}

function resolveEndpoints(form) {
  const raw = form.dataset.commentEndpoints || form.dataset.commentEndpoint || '';
  const parsed = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((endpoint) => toAbsoluteEndpoint(endpoint));

  return [...new Set(parsed)];
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
    `Contact: ${payload.contact || ''}`,
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

function withTimeout(ms = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, clear: () => clearTimeout(timeout) };
}

async function submitToEndpoint(payload, endpoint) {
  const { controller, clear } = withTimeout(12000);

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clear();
  }
}

async function submit(form, endpoints) {
  const submitButton = form.querySelector('button[type="submit"]');
  const payload = serializeForm(form);
  const issueFallbackUrl = buildIssueFallbackUrl(form);

  if (submitButton) {
    submitButton.disabled = true;
  }

  try {
    const attempts = [];

    for (const endpoint of endpoints) {
      try {
        const response = await submitToEndpoint(payload, endpoint);
        const contentType = response.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await response.json().catch(() => ({}))
          : {};
        const success = data && data.success;

        if (response.ok && success) {
          setStatus(form, data.message || 'Thanks for sharing feedback. We will review it soon.');
          form.reset();
          return;
        }

        attempts.push({
          endpoint,
          status: response.status,
          message:
            (data && data.message) ||
            (data && data.errors && data.errors.join(' ')) ||
            `Request failed with status ${response.status}.`,
        });
      } catch (error) {
        attempts.push({
          endpoint,
          status: 0,
          message:
            error.name === 'AbortError'
              ? 'Request timed out.'
              : (error && error.message) || 'Network error.',
        });
      }
    }

    const unavailable = attempts.some((attempt) => attempt.status === 404);
    const details = attempts.length
      ? attempts.map((attempt) => `${attempt.endpoint} → ${attempt.message}`).join(' ')
      : '';

    const fallbackMessage = issueFallbackUrl
      ? ` Couldn’t reach the submit service. <a href="${issueFallbackUrl}" target="_blank" rel="noopener noreferrer">Open a prefilled GitHub issue instead</a>.`
      : '';

    const helpMessage = unavailable
      ? 'Comment endpoint is unavailable. Configure COMMENTS_ENDPOINT to a deployed serverless route.'
      : 'Unable to send feedback right now. Please try again later.';

    setStatus(form, `${helpMessage}${fallbackMessage}${details ? ` (${details})` : ''}`, Boolean(issueFallbackUrl));
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

export function initCommentForms(root = document) {
  const forms = root.querySelectorAll('[data-comment-form]');
  forms.forEach((form) => {
    const endpoints = resolveEndpoints(form);

    const intentInputs = form.querySelectorAll('input[name="intent"]');
    intentInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label) {
          setStatus(form, `${label.dataset.intentLabel} selected. Add your note below.`);
        }
      });
    });

    form.addEventListener('submit', (event) => {
      const isValid = validate(form);
      if (!isValid) {
        event.preventDefault();
        return;
      }

      if (!endpoints.length) {
        event.preventDefault();
        const issueFallbackUrl = buildIssueFallbackUrl(form);
        if (issueFallbackUrl) {
          setStatus(
            form,
            `Submission endpoint is not configured yet. <a href="${issueFallbackUrl}" target="_blank" rel="noopener noreferrer">Open a prefilled GitHub issue instead</a>.`,
            true
          );
          return;
        }

        setStatus(form, 'Submission endpoint is not configured yet. Use the discussion thread below to leave your note.');
        return;
      }

      event.preventDefault();
      submit(form, endpoints);
    });
  });
}

window.addEventListener('DOMContentLoaded', () => initCommentForms());
