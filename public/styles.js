import { css } from 'https://unpkg.com/lit-element/lit-element.js?module';

  export const styles = () =>
    css`
      *,
      *::before,
      *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      * {
        -webkit-appearance: none;
      }
      :host {
        display: grid;
        place-content_: center;
        font-family: sans-serif;
        line-height: 1.5;
        min-height: 100vh;
        min-height: 100dvh;
        text-align: center;
        color: var(--text);
        background-color: var(--bg);
        padding: 2rem;
      }
      p {
        margin-bottom: 1rem;
      }
      h1 {
        font-size: 1.5rem;
        margin-bottom: 2rem;
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
        padding: 1rem;
        margin-bottom_: 1rem;
        border: 1px solid var(--dimmed);
        background-color: var(--bg);
        outline: 0;
        border-radius: var(--radius);
      }
      button {
        border: 0;
        background: 0;
        border: 1px solid var(--text);
        border-radius: var(--radius);
        padding: 1rem;
        font-size: inherit;
        color: inherit;
        cursor: pointer;
      }
      .btn-count {
        font-size: 1.5rem;
        padding: 1.25rem 1.75rem;
        font-weight: 300;
      }
      table {
        text-align_: right;
      }
      td {
        padding: 0.25rem;
      }
      .login-form {
        display: grid;
        gap: 1rem;
        margin-bottom: 3rem;
        max-width: 20rem;
      }
      .dashboard {
        display: grid;
        padding: 1rem;
        gap: 2rem;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto 1fr auto;
        grid-template-areas: 'top top' 'list list' 'form form' 'logout logout'
      }
      .history-list {
        grid-area: list; 
        overflow:auto;
        display:grid;
        grid-auto-flow:column;
        gap:2rem;
        align-content:center;
        scrollbar-width: none;
      }
      .history-list::-webkit-scrollbar {
        display: none;
      }
      label {
        color: var(--dimmed);
        display: block;
        text-align: initial;
      }
    `;
