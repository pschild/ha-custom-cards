import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

@customElement('ha-my-table')
export class MyTable extends LitElement {

  private config: { header?: string; } = {};

  setConfig(config: { header?: string; }) {
    console.log('set config', config);
    this.config = config;
  }

  render() {
    return html`
      <ha-card header="${this.config.header}">
        <div class="card-content">
          <table>
            <thead>
              <tr>
                  <th>Header 1</th>
                  <th>Header 2</th>
                  <th>Header 3</th>
                  <th>Header 4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
              <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </ha-card>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ha-my-table': MyTable
  }
}