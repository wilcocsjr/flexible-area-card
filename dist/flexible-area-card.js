// flexible-area-card.js - v37 (MODIFIED for Light Groups & Scenes, Hide Temp/Humidity icons, Fixed Header Alignment)

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
        scene: 'mdi:palette-outline',
        cover: 'mdi:window-open-variant',
        lock: 'mdi:lock',
    };
  }

  setConfig(config) {
    if (!config || !config.area) {
      throw new Error('The "area" option is required.');
    }
    this._config = {
      alert_classes: ['motion', 'occupancy', 'moisture', 'door', 'window'],
      sensor_classes: ['temperature', 'humidity'],
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
    
    // MODIFIED: Removed the .slice(0, 3) to show all found entities
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
                     (domain === 'fan' && state.state !== 'off') ||
                     (domain === 'climate' && state.state !== 'off');
        const icon = (typeof entityConf !== 'string' ? entityConf.icon : null)
                      || state.attributes.icon
                      || this._hass.entities[entityId]?.icon
                      || this.DOMAIN_ICONS[domain]
                      || 'mdi:toggle-switch-variant';
        return `<button class="entity-button ${isOn ? 'state-on' : ''}" data-entity-id="${entityId}" data-domain="${domain}"><ha-icon class="button-icon" icon="${icon}"></ha-icon>${this._isCompact ? '' : `<span class="button-name">${name}</span>`}</button>`;
    }).join('');
    // MODIFIED: Adjust grid columns based on the number of entities to prevent overflow
    const columnCount = Math.min(entities.length, 3);
    return `<div class="entities-grid" style="grid-template-columns: repeat(${columnCount}, 1fr);">${gridHTML}</div>`;
  }

  renderSummary(areaEntities) {
    const summaryIcons = [];
    const alertClassToIconMap = { moisture:'mdi:water', motion:'mdi:motion-sensor', door:'mdi:door-open', window:'mdi:window-open', gas:'mdi:gas-cylinder', smoke:'mdi:smoke', safety:'mdi:shield-check', occupancy:'mdi:home' };
    
    // MODIFICATION: Removed temperature and humidity to hide their icons
    const sensorClassToIconMap = { power: 'mdi:flash', illuminance: 'mdi:brightness-5' };
    
    const DEFAULT_ALERT_COLOR = '#F79B22';
    const DEFAULT_SENSOR_COLOR = 'rgba(var(--rgb-primary-text-color), 0.05)';

    for (const item of this._config.alert_classes) {
      const dClass = typeof item === 'string' ? item : item.device_class;
      const color = (typeof item === 'object' && item.color) ? item.color : DEFAULT_ALERT_COLOR;

      const hasAlert = areaEntities.some(e => e.state.attributes.device_class === dClass && e.state.state === 'on');
      if (hasAlert && alertClassToIconMap[dClass]) {
        const style = `background-color: ${color};`;
        summaryIcons.push(`<div class="summary-icon" style="${style}" title="${dClass} alert"><ha-icon icon="${alertClassToIconMap[dClass]}"></ha-icon></div>`);
      }
    }

    for (const item of this._config.sensor_classes) {
      const dClass = typeof item === 'string' ? item : item.device_class;
      const color = (typeof item === 'object' && item.color) ? item.color : DEFAULT_SENSOR_COLOR;
      
      const hasSensor = areaEntities.some(e => e.state.attributes.device_class === dClass);
      if (hasSensor && sensorClassToIconMap[dClass]) {
        const style = `background-color: ${color}; color: var(--primary-text-color); border: 1px solid var(--divider-color); box-sizing: border-box;`;
        summaryIcons.push(`<div class="summary-icon" style="${style}" title="${dClass}"><ha-icon icon="${sensorClassToIconMap[dClass]}"></ha-icon></div>`);
      }
    }

    return summaryIcons.length > 0 ? `<div class="summary-icons">${summaryIcons.join('')}</div>` : '';
  }

  attachEventListeners() {
    this._card.addEventListener('click', (ev) => {
      if (ev.composedPath().find(p => p.classList && p.classList.contains('entity-button'))) { return; }
      if (this._config.tap_action) {
        if (this._config.tap_action.action === 'navigate') {
          window.history.pushState(null, '', this._config.tap_action.navigation_path);
          window.dispatchEvent(new CustomEvent('location-changed'));
        } else {
          const event = new Event('hass-action', { bubbles: true, composed: true, detail: { config: this._config.tap_action, action: this._config.tap_action.action }, });
          this.dispatchEvent(event);
        }
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
      buttonEl.addEventListener('animationend', () => { buttonEl.classList.remove('scene-activated'); }, { once: true }); 
      this._hass.callService('scene', 'turn_on', { entity_id: entityId });
      return;
    }

    let service;
    switch (domain) {
      case 'cover': service = this._hass.states[entityId].state === 'open' ? 'close_cover' : 'open_cover'; break;
      case 'media_player': service = 'toggle'; break;
      case 'climate': service = 'toggle'; break;
      default: service = 'toggle'; break;
    }
    const serviceDomain = service === 'toggle' ? 'homeassistant' : domain;
    this._hass.callService(serviceDomain, service, { entity_id: entityId });
  }

  getCardSize() { return this._isCompact ? 2 : 3; }
  
  getStyles() {
    return `
      ha-card { padding: 0; display: flex; flex-direction: column; height: 100%; }
      ha-card[clickable] { cursor: pointer; --mdc-ripple-press-opacity: 0; --mdc-ripple-hover-opacity: 0; }
      @keyframes scene-activation-fade {
        from { background-color: #F4E9CC; color: #F8C530; }
        to { background-color: rgba(var(--rgb-primary-text-color), 0.05); color: var(--primary-text-color); }
      }
      .card-content-wrapper { padding: 12px; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
      /* MODIFICATION: Changed align-items to flex-start to fix title drop */
      .header-main { display: flex; align-items: flex-start; gap: 8px; }
      .header-icon { color: var(--ha-area-icon-color, var(--primary-text-color)); width: 38px; height: 38px; flex-shrink: 0; }
      .info-container { display: flex; flex-direction: column; line-height: 1.3; }
      .info-container .name { font-weight: normal; font-size: 14px; }
      .info-container .secondary-info { font-size: 12px; color: var(--secondary-text-color); }
      .summary-icons { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; max-width: 50%; }
      .summary-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; color: white !important; }
      .summary-icon ha-icon { --mdc-icon-size: 12px; }
      .entities-grid { display: grid; gap: 8px; grid-template-columns: repeat(3, 1fr); }
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

// MODIFIED: This function now gets all light groups and scenes from the area.
FlexibleAreaCard.prototype.getAutomaticEntities = function(t) { const e = ["light", "scene"]; return t.filter(t => { const i = t.domain === "light" && t.state.attributes.entity_id && Array.isArray(t.state.attributes.entity_id); const s = t.domain === "scene"; return i || s }).sort((t, i) => e.indexOf(t.domain) - e.indexOf(i.domain)).map(t => t.entity_id) };

FlexibleAreaCard.prototype.findSecondaryInfo=function(t){if(this._config.secondary_info_entity){const e=this._hass.states[this._config.secondary_info_entity];return e?`${e.state} ${e.attributes.unit_of_measurement||""}`.trim():null}for(const e of this._config.sensor_classes){const i=t.find(t=>t.state.attributes.device_class===e);if(i)return`${i.state.state} ${i.state.attributes.unit_of_measurement||""}`.trim()}return null};

customElements.define('flexible-area-card', FlexibleAreaCard);
