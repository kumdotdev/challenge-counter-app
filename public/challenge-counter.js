import {
  LitElement,
  html,
} from 'https://unpkg.com/lit-element/lit-element.js?module';
import { supabase, fetchData, fetchAllData, fetchProfile } from './api.js';
import { niceDate } from './utils.js';
import { styles } from './styles.js';

class ChallengeCounter extends LitElement {
  static styles = styles();

  static get properties() {
    return {
      state: { type: Array },
      history: { type: Object },
      user: { type: Object },
      email: { type: String },
      isAuthorized: { type: Boolean },
      isLoginSubmitted: { type: Boolean },
      isDashboard: { type: Boolean },
      isLoading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.state = [];
    this.history = {};
    this.user = {};
    this.email = '';
    this.isAuthorized = false;
    this.isLoginSubmitted = false;
    this.isDashboard = false;
    this.isLoading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.checkUser();
    supabase.auth.onAuthStateChange(async () => {
      this.checkUser();
    });
  }

  async checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const { user } = session;
      const profileData = await fetchProfile();
      this.user = {
        ...user,
        ...profileData,
      };
      this.isAuthorized = true;
      this.handleUpdates();
    } else {
      this.isLoading = false;
    }
  }

  handleUpdates = () => {
    fetchData().then((data) => {
      // console.log(data);
      this.state = data;
      this.isLoading = false;
    });

    fetchAllData().then((data) => {
      this.history = { ...data };
    });
  };

  async onClick(event) {
    event.preventDefault();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const { user } = session;
    const { data, error } = await supabase.from('count').insert([
      {
        user_id: user.id,
      },
    ]);
    const res = await fetchData();
    console.log('RES: ', res);
    this.state = [...this.state, res];
  }

  async onUIClick() {
    if (!this.isDashboard) {
      const data = await fetchAllData();
      this.history = { ...data };
    }
    this.isDashboard = !this.isDashboard;
  }

  async onSubmitUpdateProfile(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formDataJSON = {};
    formData.forEach((value, key) => (formDataJSON[key] = value));
    const { data, error } = await supabase
      .from('profile')
      .update(formDataJSON)
      .eq('id', this.user.id)
      .select()
      .single();

    if (data) {
      this.user = {
        ...this.user,
        ...formDataJSON,
      };
      alert('Profile updated');
    }
    if (error) alert(error.message);
  }

  async handleSignIn(event) {
    event.preventDefault();
    this.isLoading = true;
    const formData = new FormData(event.currentTarget);
    const email = formData.get('user');
    supabase.auth
      .signInWithOtp({ email }, { redirectTo: window.location.href })
      .then((response) => {
        this.isLoginSubmitted = true;
        this.isLoading = false;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  handleLogOut() {
    supabase.auth
      .signOut()
      .then((response) => {
        this.isAuthorized = false;
        this.isDashboard = false;
        //alert('Logout successful');
      })
      .catch((err) => {
        //alert(err.response.text);
      });
  }

  renderSignIn = () => html`
    <div style="place-self: center">
      <h1>Start Your Challenge ...</h1>
      <form 
      class="login-form"
      @submit=${this.handleSignIn}>
      <input 
      required 
      autofocus 
      name="user" 
      type="email"
      placeholder="E-Mail"
      .value=${this.email}
      />
      <button submit>
        Magic Login
      </button>
    </div>
  </form>
</div>
  `;

  render() {
    if (this.isLoading)
      return html`<div style="place-self: center">Loading ...</div>`;

    if (this.isLoginSubmitted)
      return html` <div style="place-self: center"></div>Please check your email! </div>`;

    if (!this.isAuthorized) return html` ${this.renderSignIn()} `;

    if (this.isDashboard)
      return html`
        <div class="dashboard">
          <div style="grid-area: top; display: grid;justify-content:end">
            <button @click=${this.onUIClick}>Close</button>
          </div>
          <div class="history-list">
            ${Object.keys(this.history)
              .reverse()
              .map(
                (entry) => html`
                  <span>
                    <span style="font-size:3.5rem">
                      ${this.history[entry].reduce((a, c) => {
                        return a + (c.count ? c.count : 1);
                      }, 0)}
                    </span>
                    <span style="white-space:nowrap">${entry}</span>
                  </span>
                `,
              )}
          </div>
          <form
            style="grid-area: form; display: grid;grid-auto-rows: max-content;gap:1rem;justify-self: center;max-width:17rem"
            @submit=${this.onSubmitUpdateProfile}
          >
            <div>
              <label>Challenge Name</label>
              <input
                type="text"
                name="challenge_name"
                .value=${this.user.challenge_name}
                style="width:100%;max-width: 20rem"
              />
            </div>
            <div>
              <label>Count Target</label>
              <input
                type="number"
                name="count_target"
                .value=${this.user.count_target}
                size="10"
                style="width:100%;max-width: 20rem"
              />
            </div>
            <button submit>Update</button>
          </form>
          <div style="grid-area: logout;">
            ${this.user.email}
            <button
              style="padding: .25rem .5rem;"
              @click=${this.handleLogOut}
            >
              Logout
            </button>
          </div>
        </div>
      `;

    // Default not loading state
    if (!this.isLoading)
      return html`
        <div style="place-self: center;margin-bottom: 4rem;">
          <p>
            ${this.user.challenge_name ?? 'My Challenge'}<br />
            <span style="color:var(--dimmed)"> ${niceDate(Date.now())} </span>
          </p>
          <p
            class="count"
            @click=${this.onClick}
          >
            ${this.user.count_target - this.state.length}
          </p>
          <button
            class="btn-count"
            @click=${this.onClick}
          >
            Count
          </button>

          <button
            style="color:var(--dimmed);border: none; position: absolute; right:1rem; bottom:1rem"
            @click=${this.onUIClick}
          >
            Dashboard
          </button>
        </div>
      `;
  }
}

customElements.define('challenge-counter', ChallengeCounter);
