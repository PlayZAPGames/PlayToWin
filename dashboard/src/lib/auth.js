const TOKEN_KEY = 'jwt_token';

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}



export function getToken() {
  // return localStorage.getItem(TOKEN_KEY);
  const localToken = localStorage.getItem(TOKEN_KEY);

  if (!localToken || isTokenExpired(localToken)) {
    
   return getAuthCookie();
  }

  return localToken;

  // if (localToken){
  //   console.log("local token found", localToken);
  // } 
    
  
  // Finally try cookie
  // return getAuthCookie();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUserFromToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

export function hasRole(role) {
  const user = getUserFromToken();
  return user?.role === role;
}


export function getAuthCookie() {
    console.log("token retun from cookies");
  
  const name = 'admin_token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return null;
}
