// flexible-area-card.js - v40 (MODIFIED for Light Group Priority in Auto Mode)

class FlexibleAreaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.DOMAIN_ICONS = {
        light: 'mdi:lightbulb',
        scene: 'mdi:palette',
        fan: 'mdi:fan',
        switch: 'mdi:power-plug',
        media_player: 'mdi:television',
        climate: 'mdi:thermostat',
        cover: 'mdi:window-open-variant',
        lock: 'mdi:lock',
        input_boolean: 'mdi:toggle-switch-variant',
    };
  }

  setConfig(config) {
    if (!config || !config.area) {
      throw new Error('The "area" option is required.');
    }
    this._config = {
      alert_classes: [
          'motion', 'occupancy', 'moisture', 'door', 'window',
          'gas', 'smoke', 'carbon_monoxide', 'safety', 'problem',
          'opening', 'sound', 'vibration', 'plug'
      ],
      sensor_classes: [
          'pressure', 'co2', 'volatile_organic_compounds'
      ],
      ...config,
    };
    this._isManual = !!this._config.entities && Array.isArray(this._config.entities);
    this._isCompact = this._config.compact === true;

    const root = this.shadowRoot;
    if (root.lastChild) root.removeChild(root.lastChild);

    this._card = document.createElement('ha-card');
    this._contentContainer = document.createElement('div');
    this._card.appendChild(this._contentContainer);

    const style = document.createElement('style');
    style.textContent = this.getStyles();
    root.appendChild(style);
    root.appendChild(this._card);

    if (this._hass) {
        this.firstRender();
    }
  }

  set hass(hass) {
    if (!hass) return;
    const isFirstUpdate = !this._hass;
    this._hass = hass;

    if (this._card) {
      if (isFirstUpdate) {
        this.firstRender();
      } else {
        this.updateStates();
      }
    }
  }

  firstRender() {
    const area = this._hass.areas[this._config.area];
    if (!area) {
      this.renderError(`Area not found: '${this._config.area}'`);
      return;
    }
    this._card.className = this._isCompact ? 'compact' : '';
    this._card.toggleAttribute('clickable', !!this._config.tap_action);

    const areaEntities = this.getEntitiesForArea(area.area_id);
    const headerHTML = this.renderHeader(area, areaEntities);

    const entitiesToShow = this._isManual
      ? this._config.entities
      : this.getAutomaticEntities(areaEntities);

    const contentHTML = this.renderGrid(entitiesToShow);

    this._contentContainer.innerHTML = `<div class="card-content-wrapper">${headerHTML}${contentHTML}</div>`;
    this.attachEventListeners();
  }

  updateStates() {
      const area = this._hass.areas[this._config.area];
      if (!area) return;

      const areaEntities = this.getEntitiesForArea(area.area_id);
      const secondaryInfo = this.findSecondaryInfo(areaEntities);
      const secondaryEl = this._contentContainer.querySelector('.secondary-info');
      if (secondaryEl) secondaryEl.textContent = secondaryInfo || '';

      const summaryHTML = this.renderSummary(areaEntities);
      const summaryContainer = this._contentContainer.querySelector('.summary-icons');
      const header = this._contentContainer.querySelector('.header');
      if(summaryContainer) summaryContainer.outerHTML = summaryHTML;
      else if (header && summaryHTML) header.insertAdjacentHTML('beforeend', summaryHTML);

      this._contentContainer.querySelectorAll('.entity-button[data-entity-id]').forEach(button => {
        const entityId = button.dataset.entityId;
        const domain = entityId.split('.')[0];

        if (domain === 'scene') return;

        const state = this._hass.states[entityId];
        if (state) {
            const isOn = state.state === 'on' ||
                         state.state === 'open' ||
                         state.state === 'playing' ||
                         state.state === 'locked' ||
                         (domain === 'fan' && state.state !== 'off') ||
                         (domain === 'climate' && state.state !== 'off');
            button.classList.toggle('state-on', isOn);
        }
      });
  }

  renderError(message) { this._card.innerHTML = `<div class="error-banner">${message}</div>`; }

  renderHeader(area, areaEntities) {
    const secondaryInfo = this.findSecondaryInfo(areaEntities);
    const icon = this._config.icon || area.icon || 'mdi:texture-box';
    const summaryHTML = this.renderSummary(areaEntities);
    return `<div class="header"><div class="header-main"><ha-icon class="header-icon" icon="${icon}"></ha-icon><div class="info-container"><div class="name">${this._config.area_name || area.name}</div>${secondaryInfo ? `<div class="secondary-info">${secondaryInfo}</div>` : ''}</div></div>${summaryHTML}</div>`;
  }

  renderGrid(entities) {
    if (!entities || !entities.length) return "";
    const gridHTML = entities.map(entityConf => {
        const entityId = typeof entityConf === 'string' ? entityConf : entityConf.entity;
        const state = this._hass.states[entityId];
        if (!state) return `<div class="entity-button invalid" title="Invalid: ${entityId}">!</div>`;
        const name = (typeof entityConf !== 'string' && entityConf.name) || state.attributes.friendly_name;
        const domain = entityId.split('.')[0];
        const isOn = state.state === 'on' ||
                     state.state === 'open' ||
                     state.state === 'playing' ||
                     state.state === 'locked' ||
                     (domain === 'fan' && state.state !== 'off') ||
                     (domain === 'climate' && state.state !== 'off');
        const icon = (typeof entityConf !== 'string' ? entityConf.icon : null)
                      || state.attributes.icon
                      || this._hass.entities[entityId]?.icon
                      || this.DOMAIN_ICONS[domain]
                      || 'mdi:toggle-switch-variant';
        return `<button class="entity-button ${isOn ? 'state-on' : ''}" data-entity-id="${entityId}" data-domain="${domain}"><ha-icon class="button-icon" icon="${icon}"></ha-icon>${this._isCompact ? '' : `<span class="button-name">${name}</span>`}</button>`;
    }).join('');

    const columnCount = this._config.columns || Math.min(entities.length, 3);
    return `<div class="entities-grid" style="grid-template-columns: repeat(${columnCount}, 1fr);">${gridHTML}</div>`;
  }

  renderSummary(areaEntities) {
    const summaryIcons = [];
    const alertClassToIconMap = {
        motion: 'mdi:motion-sensor', occupancy: 'mdi:home', moisture: 'mdi:water',
        door: 'mdi:door-open', window: 'mdi:window-open', gas: 'mdi:gas-cylinder',
        smoke: 'mdi:smoke', carbon_monoxide: 'mdi:molecule-co', safety: 'mdi:shield-check',
        problem: 'mdi:alert-circle', opening: 'mdi:box-variant', sound: 'mdi:ear-hearing',
        vibration: 'mdi:vibrate', plug: 'mdi:power-plug-off'
    };

    const sensorClassToIconMap = {
        temperature: 'mdi:thermometer', humidity: 'mdi:water-percent', power: 'mdi:flash',
        illuminance: 'mdi:brightness-5', pressure: 'mdi:gauge', battery: 'mdi:battery',
        co2: 'mdi:molecule-co2', volatile_organic_compounds: 'mdi:air-filter'
    };

    const DEFAULT_ALERT_COLOR = '#F79B22';
    const DEFAULT_SENSOR_COLOR = 'rgba(var(--rgb-primary-text-color), 0.05)';

    for (const item of this._config.alert_classes) {
      const dClass = typeof item === 'string' ? item : item.device_class;
      const color = (typeof item === 'object' && item.color) ? item.color : DEFAULT_ALERT_COLOR;
      const hasAlert = areaEntities.some(e => e.state.attributes.device_class === dClass && e.state.state === 'on');
      if (hasAlert && alertClassToIconMap[dClass]) {
        summaryIcons.push(`<div class="summary-icon" style="background-color: ${color};" title="${dClass} alert"><ha-icon icon="${alertClassToIconMap[dClass]}"></ha-icon></div>`);
      }
    }

    for (const item of this._config.sensor_classes) {
      const dClass = typeof item === 'string' ? item : item.device_class;
      const color = (typeof item === 'object' && item.color) ? item.color : DEFAULT_SENSOR_COLOR;
      const hasSensor = areaEntities.some(e => e.state.attributes.device_class === dClass);
      if (hasSensor && sensorClassToIconMap[dClass]) {
        summaryIcons.push(`<div class="summary-icon" style="background-color: ${color}; color: var(--primary-text-color); border: 1px solid var(--divider-color); box-sizing: border-box;" title="${dClass}"><ha-icon icon="${sensorClassToIconMap[dClass]}"></ha-icon></div>`);
      }
    }

    return summaryIcons.length > 0 ? `<div class="summary-icons">${summaryIcons.join('')}</div>` : '';
  }

  attachEventListeners() {
    this._card.addEventListener('click', (ev) => {
      if (ev.composedPath().find(p => p.classList && p.classList.contains('entity-button'))) { return; }
      if (this._config.tap_action) {
        const detail = { config: this._config.tap_action, action: this._config.tap_action.action };
        const event = new Event('hass-action', { bubbles: true, composed: true, detail });
        this.dispatchEvent(event);
      }
    });
    this._contentContainer.querySelectorAll('.entity-button').forEach(button => {
      button.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if(button.dataset.entityId) { this._handleButtonTap(button.dataset.entityId, button); }
      });
    });
  }

  _handleButtonTap(entityId, buttonEl) {
    const domain = entityId.split('.')[0];
    if (domain === 'scene') {
      buttonEl.classList.add('scene-activated');
      buttonEl.addEventListener('animationend', () => buttonEl.classList.remove('scene-activated'), { once: true });
      this._hass.callService('scene', 'turn_on', { entity_id: entityId });
      return;
    }

    let service;
    const state = this._hass.states[entityId].state;
    switch (domain) {
      case 'lock': service = state === 'locked' ? 'unlock' : 'lock'; break;
      case 'cover': service = state === 'open' ? 'close_cover' : 'open_cover'; break;
      default: service = 'toggle'; break;
    }
    const serviceDomain = service === 'toggle' ? 'homeassistant' : domain;
    this._hass.callService(serviceDomain, service, { entity_id: entityId });
  }

  getCardSize() { return this._isCompact ? 2 : 3; }

  getStyles() {
    return `
      ha-card { padding: 0; display: flex; flex-direction: column; height: 100%; }
      ha-card[clickable] { cursor: pointer; }
      @keyframes scene-activation-fade {
        from { background-color: #F4E9CC; color: #F8C530; }
        to { background-color: rgba(var(--rgb-primary-text-color), 0.05); color: var(--primary-text-color); }
      }
      .card-content-wrapper { padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      .header-main { display: flex; align-items: flex-start; gap: 8px; }
      .header-icon { color: var(--ha-area-icon-color, var(--primary-text-color)); width: 38px; height: 38px; flex-shrink: 0; }
      .info-container { display: flex; flex-direction: column; line-height: 1.3; }
      .info-container .name { font-weight: normal; font-size: 14px; }
      .info-container .secondary-info { font-size: 12px; color: var(--secondary-text-color); }
      .summary-icons { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; max-width: 50%; }
      .summary-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; color: white !important; }
      .summary-icon ha-icon { --mdc-icon-size: 12px; }
      .entities-grid { display: grid; gap: 8px; }
      .entity-button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; height: 52px; border-radius: 10px; border: none; color: var(--primary-text-color); cursor: pointer; transition: background-color 0.25s; box-sizing: border-box; background-color: rgba(var(--rgb-primary-text-color), 0.05); }
      .entity-button.state-on { background-color: #F4E9CC; color: #F8C530; }
      .entity-button.scene-activated { animation: scene-activation-fade 2s ease-out; }
      .button-icon { --mdc-icon-size: 22px; }
      .button-name { font-size: 12px; }
      .compact .entity-button { height: 42px; }
      .compact .button-name { display: none; }
    `;
  }
}

FlexibleAreaCard.prototype.getEntitiesForArea=function(t){const{devices:e,entities:i}=this._hass,s=Object.values(e).filter(e=>e.area_id===t).map(e=>e.id);return Object.values(i).filter(e=>e.area_id===t||e.device_id&&s.includes(e.device_id)).map(e=>{const t=this._hass.states[e.entity_id];return t?{...e,state:t,domain:e.entity_id.split(".")[0]}:null}).filter(Boolean)};

// MODIFIED: This function now prioritizes light groups. If any are found in the area, only they are shown.
// If no light groups are found, it falls back to showing all individual lights. Scenes are always shown.
FlexibleAreaCard.prototype.getAutomaticEntities = function(areaEntities) {
  const priority = ['light', 'scene'];

  const allLights = areaEntities.filter(e => e.domain === 'light');
  const allScenes = areaEntities.filter(e => e.domain === 'scene');

  // A light group is identified by having an 'entity_id' attribute that is an array of other lights.
  const lightGroups = allLights.filter(e => e.state.attributes.entity_id && Array.isArray(e.state.attributes.entity_id));

  let lightsToShow;
  if (lightGroups.length > 0) {
    // If groups exist, use only them.
    lightsToShow = lightGroups;
  } else {
    // Otherwise, fall back to all individual lights.
    lightsToShow = allLights;
  }

  const finalEntities = [...lightsToShow, ...allScenes];

  return finalEntities
    .sort((a, b) => priority.indexOf(a.domain) - priority.indexOf(b.domain))
    .map(entity => entity.entity_id);
};

FlexibleAreaCard.prototype.findSecondaryInfo=function(t){if(this._config.secondary_info_entity){const e=this._hass.states[this._config.secondary_info_entity];return e?`${e.state.state} ${e.attributes.unit_of_measurement||""}`.trim():null}const e=t.find(e=>e.state.attributes.device_class==="temperature");if(e)return`${e.state.state} ${e.state.attributes.unit_of_measurement||""}`.trim();for(const i of this._config.sensor_classes){const s=typeof i=="string"?i:i.device_class,a=t.find(e=>e.state.attributes.device_class===s);if(a)return`${a.state.state} ${a.state.attributes.unit_of_measurement||""}`.trim()}return null};

customElements.define('flexible-area-card', FlexibleAreaCard);
