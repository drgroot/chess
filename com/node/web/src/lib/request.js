const responseParser = (response) => response.json();

export const get = (path, params = false) => {
  const url = new URL(window.location.origin + path);
  if (params) {
    url.search = new URLSearchParams(params).toString();
  }

  return fetch(
    url,
    {
      method: 'GET',
      mode: 'same-origin',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
    },
  )
    .then(responseParser);
};

export const post = (path, data = {}) => fetch(path, {
  method: 'POST',
  mode: 'same-origin',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
  },
  redirect: 'follow',
  body: JSON.stringify(data),
})
  .then(responseParser);
