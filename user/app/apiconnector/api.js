//const BASE_URL = 'http://52.66.8.192:8080/api';
// const BASE_URL = 'http://localhost:8080/api';
const BASE_URL  = "https://fil-x-connect-final-backend.onrender.com/api";
export async function apiRequest(endPoint, method, body) {
  const url = `${BASE_URL}/${endPoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return response.json();
}
