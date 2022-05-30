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

const dayShort = (date) => new Date(date).toISOString().substring(0,10);

const niceDate = (date) => new Date(date).toLocaleDateString('de-DE', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const fetchData = async (day) => {
  const { data: counts, error } = await supabase.from('count').select('*').eq('day', day);
  if (error) {
    console.log(error);
  }
  return counts[0];
};

const fetchAllData = async () => {
  const { data: counts, error } = await supabase.from('count').select('*').order('day', { ascending: true });
  if (error) {
    console.log(error);
  }
  return counts;
};

class ChallengeCounter extends LitElement {
  static get properties() {
    return {
      state: { type: Object },
      today: { type: String },
      count: { type: Number },
      isAuthorized: { type: Boolean },
      isLoginSubmitted: { type: Boolean },
      isDashboard: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.email = '';
    this.today = dayShort(new Date());
    this.count = 0;
    this.state = [];
  }

  async connectedCallback() {
    super.connectedCallback();


    // document.addEventListener('visibilitychange', () => {alert(document.visibilityState)})

    // window.addEventListener('pageshow', event => {alert('pageshow event') });

    // if ('wakeLock' in navigator) {
    //   // Screen Wake Lock API supported 🎉
    //   alert('lock supported')
    // }

    const user = supabase.auth.user();
    if (user) {
      this.isAuthorized = true;
      const data = await fetchData(this.today);
      this.count = data?.count || 0;
      this.state = await fetchAllData();

      const { data: count, error } = await supabase
      .from('count')
      .on('*', this.handleUpdates)
      .subscribe()

    }
  }

  handleUpdates = () => {
    fetchData(this.today).then(data=>{
      this.count = data?.count || 0;
    });

    fetchAllData().then(data=> {
      this.state = data;
    });
  }

  static get styles() {
    return css`
      :host {
        --bg: white;
        --text: #222;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --bg: #222;
          --text: #ededed;
        }
      }

      body {
        color: var(--text);
      }
      .count {
        font-size: 12rem;
        letter-spacing: -5px;
      }
      input {
        display: block;
        font-size: inherit;
        color: inherit;
        padding: .75rem 1rem;
        margin-bottom: 1rem;
        border: 1px solid var(--text);
        background-color: var(--bg);
      }
      button {
        border: 0;
        background: 0;
        border: 1px solid var(--text);
        border-radius: 4px;
        padding: .5rem 1rem;
        font-size: inherit;
        color: inherit;
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
        padding: .25rem;
      }
    `;
  }

  async onClick(event) {
    event.preventDefault();
    this.count = ++this.count;

    // evil solution!!!
    if (this.state.filter(item=>item.day === this.today).length) {
      const { data, error } = 
      await supabase
        .from('count')
        .update({count : this.count })
        .eq('day', this.today);

    } else {
      const { data, error } = 
        await supabase
          .from('count')
          .insert([{
            user_id: supabase.auth.user().id,
            day: this.today,
            count : this.count,
          }]);
    }
    this.state = await fetchAllData();
  }

  async onUIClick() {
    if (!this.isDashboard) this.state = await fetchAllData();
    this.isDashboard = !this.isDashboard;
  }

  async handleSignIn(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('user');
    supabase.auth
      .signIn({ email }, { redirectTo: 'https://cc.k4330.com' })
      .then((response) => {
        this.isLoginSubmitted = true;
        //response.error ? alert(response.error.message) : this.setToken(response);
      })
      .catch((err) => {
        console.log(err);
        //alert(err.response.text);
      });
  }

  handleLogOut() {
    supabase.auth
      .signOut()
      .then((response) => {
        this.isAuthorized = false;
        this.isDashboard = false;
        alert('Logout successful');
      })
      .catch((err) => {
        alert(err.response.text);
      });
  }

  // handleOAuthLogin = async (provider) => {
  //   // You need to enable the third party auth you want in Authentication > Settings
  //   // Read more on: https://supabase.com/docs/guides/auth#third-party-logins
  //   let { error } = await supabase.auth.signIn({ provider });
  //   if (error) console.log("Error: ", error.message);
  // };

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

    if (this.isLoginSubmitted) return html`
        Please check your email!
      `

    if (!this.isAuthorized) return html`
        ${this.renderSignIn()}
      `

    return html`
     ${!this.isDashboard ? html`

        <span class="count">
          ${COUNT_TARGET - this.count}
        </span><br />
        <span>
          ${niceDate(Date.now())}
          [${COUNT_TARGET}]
        </span><br /><br />
        <button 
          class="btn-count"  
          @click=${this.onClick}>
          Count
        </button>

     ` : html`
        <table>
          <tbody>
            ${this.state.map((entry) => html`
              <tr>
                <td>
                  ${niceDate(entry.day)}
                </td>
                <td>
                  ${entry.count}
                </td>
              </tr>
              `
            )}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>
                  Gesamt
                </strong>
              </td>
              <td>
                <strong>
                  ${this.state.reduce((prev, curr) => prev + curr.count , 0)}
                </strong>
              </td>
            </tr>
          </tfoot>
        </table><br/><br/>
        ${supabase.auth.user().email}<br/><br/>
        <button  
          @click=${this.handleLogOut}>
          Logout
        </button>
     `}

     <button
        style="position: absolute; right:1rem; top:1rem"
        @click=${this.onUIClick}>
        ${this.isDashboard ? 'close' : 'Dashboard'}
      </button>
    `;
  }
}

customElements.define('challenge-counter', ChallengeCounter);
