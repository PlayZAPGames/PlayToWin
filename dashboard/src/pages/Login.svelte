<script>
  import { loginUser, setup2FA } from '../lib/api';
  import { saveToken, getUserFromToken } from '../lib/auth';
  import { user, isAuthenticated } from '../stores/authStore';
  import { push } from 'svelte-spa-router';
  import toast from 'svelte-french-toast';


  // let email = 'dev@piper.com'
  //  password = 'Admin@123'

  let email = '', password = '', otp = '', error = '', qr = '', secret = '';
 let awaitingOTP = false;

  async function handleLogin() {
    const res = await loginUser({ email, password, otp });
   
      if (res.setup) {
      // First-time login: Show QR and ask user to enter OTP again
      otp = '';
      qr = res.qr;
      secret = res.secret;
      awaitingOTP = true;
      toast.success("Scan the QR and enter Pass key again to complete setup.");
      return;
    }
   
    if (res.token) {

      console.log("res.token", res.token);
      
      saveToken(res.token);
      user.set(getUserFromToken());
      isAuthenticated.set(true);
      push('#/');
    } else {      
      user.set(null);
      isAuthenticated.set(false);
      toast.error(res.message || 'Login failed');
    }
  }

    async function completeSetup() {
    const res = await setup2FA({ email, otp, secret });

    if (res.token) {
      toast.success("Setup complete! Redirecting...");
      saveToken(res.token);
      user.set(getUserFromToken());
      isAuthenticated.set(true);
      push('#/');
    } else {
      user.set(null);
      isAuthenticated.set(false);
      toast.error(res.message || 'Invalid OTP');
    }
  }
</script>

<div class="container">
  <div class="justify-content-center">
        <h3 class="name" style='color:black'>Survival admin portal </h3>
  </div>
  <div class="login-container">
    <div class="login-card">
    <div class="left-image">
      <img src="https://fastly.picsum.photos/id/48/600/800.jpg?hmac=2wZLSV6cVVlCor4gGLtRhKgUyw2ra8YbmJbSQCIbS9s" alt="Login visual" />
    </div>

    <div class="right-form">
      <h2>Hi Admin!</h2>
      {#if error}
        <p class="error-text">{error}</p>
      {/if}
      {#if !awaitingOTP}
        <form on:submit|preventDefault={handleLogin}>
          <input type="email" bind:value={email} placeholder="Email" required />
          <input type="password" bind:value={password} placeholder="Password" required />
          <input type="text" bind:value={otp} placeholder="Pass Key"  />
          <button type="submit">Login</button>
        </form>
      {:else}
        <div class="qr-box">
          <img src={qr} alt="Scan this QR with Google Authenticator" />
          <p>Scan QR with Google Authenticator and enter the code</p>
          <input type="text" bind:value={otp} placeholder="Enter pass key from Authenticator " />
          <button on:click={completeSetup}>Complete Setup</button>
        </div>
      {/if}
    </div>
  </div>
</div>
</div>

<style>
  .name{
    margin-top: 0;
    padding-top: 2%;
  }

  .container{
    height: 100vh;
    background: linear-gradient(to bottom, #4a90e2, #184e9d) !important;

  }
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .login-card {
    display: flex;
    max-width: 900px;
    max-height: 100vh;
    width: 800%;
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    margin-top: 3rem;
    margin-bottom: 3rem;
  }

  .left-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .left-image {
    flex: 1;
    min-width: 300px;
  }

  .right-form {
    flex: 1;
    padding: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .right-form h2 {
    margin-bottom: 20px;
    color: #333;
    text-align: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  input {
    padding: 4px 16px;
    font-size: 1rem;
    border-radius: 9999px;
    border: 1px solid #ccc;
    outline: none;
    transition: border-color 0.3s ease;
  }

  input:focus {
    border-color: #4a90e2;
  }

  button {
    background-color: #4a6ef1;
    color: white;
    padding: 14px 18px;
    font-size: 1rem;
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  button:hover {
    background-color: #3859cc;
  }

  .error-text {
    color: red;
    margin-bottom: 10px;
    text-align: center;
  }
</style>
