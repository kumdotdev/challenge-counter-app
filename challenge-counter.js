// war ursprünglich als kleine digitale hilfe bei der
// push up challenge gedacht
// zu erst einfacher count-state als localstorage

// dann kam noch jwt mit php dazu, als übung ... und die speicherung
// auf dem server als json in datei

// dann nooch mal die anbindung an supabase ...

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

import {
  LitElement,
  html,
  css,
} from 'https://unpkg.com/lit-element/lit-element.js?module';

const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMTg5Njc0NywiZXhwIjoxOTQ3NDcyNzQ3fQ.4z6eizw4N98xNyfEW7NJvpGKCcLOsXHbzDLK5X0BMfw';
const SUPABASE_URL = 'https://fbvcrmpsstlvjvayifbe.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COUNT_TARGET = 50;

const dayShort = (date = Date.now()) =>
  new Date(date).toISOString().substring(0, 10);

const niceDate = (date) =>
  new Date(date).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const fetchProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { user } = session;
  const { data: profile, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) {
    console.log(error);
  }
  return profile;
};

const fetchData = async () => {
  const { data, error } = await supabase
    .from('count')
    .select('*', { count: 'exact', head: false })
    .gte('created_at', new Date().toDateString());
  // .lte('created_at', new Date().toDateString());

  console.log(data);

  if (error) {
    console.log(error);
  }
  return data;
};

const fetchAllData = async () => {
  const { data, error } = await supabase
    .from('count')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.log(error);
  }
  return data;
};

class ChallengeCounter extends LitElement {
  static get properties() {
    return {
      state: { type: Array },
      history: { type: Array },
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
    this.history = [];
    this.user = {};
    this.email = '';
    this.isAuthorized = false;
    this.isLoginSubmitted = false;
    this.isDashboard = false;
    this.isLoading = true;
  }

  async connectedCallback() {
    super.connectedCallback();
    supabase.auth.onAuthStateChange(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { user } = session;
      if (user) {
        const profileData = await fetchProfile();
        this.user = {
          ...user,
          ...profileData,
        };
        this.isAuthorized = true;
        this.handleUpdates();
      }
    });
  }

  handleUpdates = () => {
    fetchData().then((data) => {
      // console.log(data);
      this.state = data;
      this.isLoading = false;
    });

    fetchAllData().then((data) => {
      // console.log(data);
      this.history = [...data];
    });
  };

  static get styles() {
    return css`
      *,
      *::before,
      *::after {
        margin: 0;
        padding: 0;
      }
      * {
        -webkit-appearance: none;
      }
      p {
        margin-bottom: 1rem;
      }
      .count {
        font-size: 12rem;
        letter-spacing: -0.25rem;
        cursor: pointer;
        line-height: 1.1;
      }
      input {
        display: inline-block;
        font-size: inherit;
        color: inherit;
        padding: 0.5rem 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--text);
        background-color: var(--bg);
      }
      button {
        border: 0;
        background: 0;
        border: 1px solid var(--text);
        border-radius: 4px;
        padding: 0.5rem 1rem;
        font-size: inherit;
        color: inherit;
        cursor: pointer;
      }
      .btn-count {
        font-size: 1.5rem;
        padding: 1.5rem 2rem;
        font-weight: 300;
      }
      table {
        text-align: right;
      }
      td {
        padding: 0.25rem;
      }
    `;
  }

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
    if (!this.isDashboard) this.history = await fetchAllData();
    this.isDashboard = !this.isDashboard;
  }

  async onSubmitSetTarget(event) {
    event.preventDefault();
    const { data, error } = await supabase
      .from('profile')
      .update({
        count_target: event.currentTarget.countTarget.value,
      })
      .eq('id', this.user.id)
      .select()
      .single();

    if (data) {
      this.user = {
        ...this.user,
        count_target: data.count_target,
      };
    }
  }

  async handleSignIn(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('user');
    supabase.auth
      .signInWithOtp({ email }, { redirectTo: window.location.href })
      .then((response) => {
        this.isLoginSubmitted = true;
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
    <form @submit=${this.handleSignIn}>
      <input 
        required 
        autofocus 
        name="user" 
        type="email"
        placeholder="email"
        .value=${this.email}
        />
        <button submit>
          Magic Login
        </button>
      </div>
    </form>
  `;

  render() {
    // if (this.isLoading) return html` Loading ...`;

    if (this.isLoginSubmitted) return html` Please check your email! `;

    if (!this.isAuthorized) return html` ${this.renderSignIn()} `;

    if (this.isDashboard)
      return html`
        <button
          style="position: fixed; right:1rem; top:1rem"
          @click=${this.onUIClick}
        >
          Close
        </button>
        <table>
          <tbody>
            ${this.history.map(
              (entry) => html`
                <tr>
                  <td>${niceDate(entry.created_at)}</td>
                  <td>1</td>
                </tr>
              `,
            )}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong> Gesamt </strong>
              </td>
              <td>
                <strong> ${this.history.length} </strong>
              </td>
            </tr>
          </tfoot>
        </table>
        <br /><br />
        <form @submit=${this.onSubmitSetTarget}>
          <input
            type="number"
            name="countTarget"
            .value=${this.user.count_target}
            size="8"
            style="max-width: 4rem"
          />
          <button submit>Set</button>
        </form>
        <br />
        ${this.user.email}<br /><br />
        <button @click=${this.handleLogOut}>Logout</button>
      `;

    // Default not loading state
    if (!this.isLoading)
      return html`
        <p>
          ${this.user.count_target} Push Up Challenge<br />
          ${niceDate(Date.now())}
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
          style="position: absolute; right:1rem; top:1rem"
          @click=${this.onUIClick}
        >
          Dashboard
        </button>
      `;
  }
}

customElements.define('challenge-counter', ChallengeCounter);
