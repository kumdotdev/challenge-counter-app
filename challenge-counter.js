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

const dayShort = (date = Date.now()) => new Date(date).toISOString().substring(0,10);

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
      countTarget: { type: Number },
      isAuthorized: { type: Boolean },
      isLoginSubmitted: { type: Boolean },
      isDashboard: { type: Boolean },
      isLoading: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.isLoading = true;
    this.email = '';
    this.today = dayShort();
    this.count = null;
    this.countTarget = null;
    this.state = [];
  }

  async connectedCallback() {
    super.connectedCallback();
    supabase.auth.onAuthStateChange(async ()=> {
      const user = supabase.auth.user();
      if (user) {
        this.isAuthorized = true;
        const data = await fetchData(dayShort());
        this.count = data?.count || 0;
        this.state = await fetchAllData();
        this.isLoading = false;
        const { data: count, error } = await supabase
          .from('count')
          .on('*', this.handleUpdates)
          .subscribe()
      }
      
    })
      
      
  }

  handleUpdates = () => {
    fetchData(this.today).then(data=>{
    });

    fetchAllData().then(data=> {
      this.state = data;
    });
  }

  static get styles() {
    return css`
      *, *::before, *::after {
        margin: 0;
        padding: 0;
      }
      p {
        margin-bottom: 1rem;
      }
      .count {
        font-size: 12rem;
        letter-spacing: -.25rem;
        cursor: pointer;
        line-height: 1.1;
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

    if (this.isLoginSubmitted) return html`
        Please check your email!
      `

    if (!this.isAuthorized) return html`
        ${this.renderSignIn()}
      `

    if (this.isDashboard) return html`
      <button
        style="position: absolute; right:1rem; top:1rem"
        @click=${this.onUIClick}>
        Close
      </button>
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
    `

    // Default not loading state
    if (!this.isLoading) return html`
      <p>
        ${COUNT_TARGET} Push Up Challenge<br/>
        ${niceDate(Date.now())}
      </p>
      <p 
        class="count"
        @click=${this.onClick}
        >
        ${this.count !== null ? COUNT_TARGET - this.count < 0 ? '+' : '' : ''}${this.count !== null ? Math.abs(COUNT_TARGET - this.count) : ''}
      </p>
      <button 
        class="btn-count"  
        @click=${this.onClick}>
        Count
      </button>

      <button
        style="position: absolute; right:1rem; top:1rem"
        @click=${this.onUIClick}>
        Dashboard
      </button>
    `

    return html`
      loading ...
     `
  }
}

customElements.define('challenge-counter', ChallengeCounter);
