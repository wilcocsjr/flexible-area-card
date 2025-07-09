// flexible-area-card.js - v42 (MODIFIED with Standard Hover/Click Feedback)

class FlexibleAreaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
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

    const entitiesToShow = this._isManual ?
      this._config.entities :
      this.getAutomaticEntities(areaEntities);

    const contentHTML = this.renderGrid(entitiesToShow);

    // MODIFIED: Added a conditional ripple for the main card tap_action
    const rippleHTML = this._config.tap_action ? '<ha-ripple></ha-ripple>' : '';
    this._contentContainer.innerHTML = `<div class="card-content-wrapper">${headerHTML}${contentHTML}${rippleHTML}</div>`;
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
    if (summaryContainer) summaryContainer.outerHTML = summaryHTML;
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

  renderError(message) {
    this._card.innerHTML = `<div class="error-banner">${message}</div>`;
  }

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
      const icon = (typeof entityConf !== 'string' ? entityConf.icon : null) ||
        state.attributes.icon ||
        this._hass.entities[entityId] ?.icon ||
        this.DOMAIN_ICONS[domain] ||
        'mdi:toggle-switch-variant';
      
      // MODIFIED: Added <ha-ripple> inside the button for click feedback
      return `<button class="entity-button ${isOn ? 'state-on' : ''}" data-entity-id="${entityId}" data-domain="${domain}"><ha-icon class="button-icon" icon="${icon}"></ha-icon>${this._isCompact ? '' : `<span class="button-name">${name}</span>`}<ha-ripple></ha-ripple></button>`;
    }).join('');

    const columnCount = this._config.columns || Math.min(entities.length, 3);
    return `<div class="entities-grid" style="grid-template-columns: repeat(${columnCount}, 1fr);">${gridHTML}</div>`;
  }

  renderSummary(areaEntities) {
    const summaryIcons = [];
    const alertClassToIconMap = {
      motion: 'mdi:motion-sensor',
      occupancy: 'mdi:home',
      moisture: 'mdi:water',
      door: 'mdi:door-open',
      window: 'mdi:window-open',
      gas: 'mdi:gas-cylinder',
      smoke: 'mdi:smoke',
      carbon_monoxide: 'mdi:molecule-co',
      safety: 'mdi:shield-check',
      problem: 'mdi:alert-circle',
      opening: 'mdi:box-variant',
      sound: 'mdi:ear-hearing',
      vibration: 'mdi:vibrate',
      plug: 'mdi:power-plug-off'
    };

    const sensorClassToIconMap = {
      temperature: 'mdi:thermometer',
      humidity: 'mdi:water-percent',
      power: 'mdi:flash',
      illuminance: 'mdi:brightness-5',
      pressure: 'mdi:gauge',
      battery: 'mdi:battery',
      co2: 'mdi:molecule-co2',
      volatile_organic_compounds: 'mdi:air-filter'
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
      if (ev.composedPath().find(p => p.classList && p.classList.contains('entity-button'))) {
        return;
      }
      if (this._config.tap_action) {
        this._fireAction(this._config.tap_action);
      }
    });

    this._contentContainer.querySelectorAll('.entity-button').forEach(button => {
      button.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (button.dataset.entityId) {
          this._handleButtonTap(button.dataset.entityId, button);
        }
      });
    });
  }

  _fireAction(actionConfig, entityId) {
    const config = { ...actionConfig };

    if (config.action === 'more-info' && !config.entity_id && !config.entity) {
      config.entity = entityId;
    }

    if (config.action === 'navigate' && config.navigation_path) {
      window.history.pushState(null, '', config.navigation_path);
      window.dispatchEvent(new CustomEvent('location-changed'));
    } else {
      const event = new CustomEvent('hass-action', {
        bubbles: true,
        composed: true,
        detail: {
          config: config,
          action: config.action
        },
      });
      this.dispatchEvent(event);
    }
  }

  _handleButtonTap(entityId, buttonEl) {
    let entityConf;
    if (this._isManual) {
      entityConf = this._config.entities.find(e =>
        (typeof e === 'string' ? e : e.entity) === entityId
      );
    }

    if (typeof entityConf === 'object' && entityConf.tap_action) {
      this._fireAction(entityConf.tap_action, entityId);
      return;
    }

    const domain = entityId.split('.')[0];

    if (domain === 'scene') {
      buttonEl.classList.add('scene-activated');
      buttonEl.addEventListener('animationend', () => buttonEl.classList.remove('scene-activated'), {
        once: true
      });
      this._hass.callService('scene', 'turn_on', {
        entity_id: entityId
      });
      return;
    }

    let service;
    const state = this._hass.states[entityId].state;
    switch (domain) {
      case 'lock':
        service = state === 'locked' ? 'unlock' : 'lock';
        break;
      case 'cover':
        service = state === 'open' ? 'close_cover' : 'open_cover';
        break;
      default:
        service = 'toggle';
        break;
    }
    const serviceDomain = service === 'toggle' ? 'homeassistant' : domain;
    this._hass.callService(serviceDomain, service, {
      entity_id: entityId
    });
  }

  getCardSize() {
    return this._isCompact ? 2 : 3;
  }

  getEntitiesForArea(areaId) {
    const {
      devices,
      entities
    } = this._hass;
    const deviceIdsInArea = Object.values(devices)
      .filter(device => device.area_id === areaId)
      .map(device => device.id);

    return Object.values(entities)
      .filter(entity => entity.area_id === areaId || (entity.device_id && deviceIdsInArea.includes(entity.device_id)))
      .map(entity => {
        const state = this._hass.states[entity.entity_id];
        if (!state) return null;
        return {
          ...entity,
          state: state,
          domain: entity.entity_id.split('.')[0]
        };
      })
      .filter(Boolean);
  }

  getAutomaticEntities(areaEntities) {
    const priority = ['light', 'scene'];

    const allLights = areaEntities.filter(e => e.domain === 'light');
    const allScenes = areaEntities.filter(e => e.domain === 'scene');

    const lightGroups = allLights.filter(e => e.state.attributes.entity_id && Array.isArray(e.state.attributes.entity_id));

    let lightsToShow;
    if (lightGroups.length > 0) {
      lightsToShow = lightGroups;
    } else {
      lightsToShow = allLights;
    }

    const finalEntities = [...lightsToShow, ...allScenes];

    return finalEntities
      .sort((a, b) => priority.indexOf(a.domain) - priority.indexOf(b.domain))
      .map(entity => entity.entity_id);
  }

  findSecondaryInfo(areaEntities) {
    if (this._config.secondary_info_entity) {
      const entity = this._hass.states[this._config.secondary_info_entity];
      return entity ? `${entity.state} ${entity.attributes.unit_of_measurement || ""}`.trim() : null;
    }

    const tempSensor = areaEntities.find(e => e.state.attributes.device_class === "temperature");
    if (tempSensor) {
      return `${tempSensor.state.state} ${tempSensor.state.attributes.unit_of_measurement || ""}`.trim();
    }

    for (const sensorClassConfig of this._config.sensor_classes) {
      const deviceClass = typeof sensorClassConfig === "string" ? sensorClassConfig : sensorClassConfig.device_class;
      const sensor = areaEntities.find(e => e.state.attributes.device_class === deviceClass);
      if (sensor) {
        return `${sensor.state.state} ${sensor.state.attributes.unit_of_measurement || ""}`.trim();
      }
    }
    return null;
  }

  getStyles() {
    // MODIFIED: The entire styles section is updated for hover and ripple effects.
    return `
      ha-card {
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: background .2s ease-in-out; /* ADDED: Smooth background transition for hover */
      }
      ha-card[clickable] {
        cursor: pointer;
      }
      /* ADDED: Standard hover effect for the whole card */
      ha-card[clickable]:hover {
        background: var(--state-color, rgba(var(--rgb-primary-text-color), 0.05));
      }
      @keyframes scene-activation-fade {
        from {
          background-color: #F4E9CC;
          color: #F8C530;
        }
        to {
          background-color: rgba(var(--rgb-primary-text-color), 0.05);
          color: var(--primary-text-color);
        }
      }
      .card-content-wrapper {
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        flex-grow: 1;
        position: relative; /* ADDED: For containing the card's ripple effect */
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }
      .header-main {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        flex-shrink: 1;
        min-width: 0;
      }
      .header-icon {
        color: var(--ha-area-icon-color, var(--primary-text-color));
        width: 38px;
        height: 38px;
        flex-shrink: 0;
      }
      .info-container {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
        justify-content: center;
      }
      .info-container .name {
        font-weight: normal;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .info-container .secondary-info {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .summary-icons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
        max-width: 50%;
        flex-shrink: 0;
      }
      .summary-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        color: white !important;
      }
      .summary-icon ha-icon {
        --mdc-icon-size: 12px;
      }
      .entities-grid {
        display: grid;
        gap: 8px;
      }
      .entity-button {
        position: relative; /* ADDED: For containing the button's ripple effect */
        overflow: hidden; /* ADDED: To clip the ripple to the button's border-radius */
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        height: 52px;
        border-radius: 10px;
        border: none;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: background-color 0.25s;
        box-sizing: border-box;
        background-color: rgba(var(--rgb-primary-text-color), 0.05);
      }
      /* ADDED: Hover effect for buttons that are not in the 'on' state */
      .entity-button:not(.state-on):hover {
        background-color: rgba(var(--rgb-primary-text-color), 0.1);
      }
      .entity-button.state-on {
        background-color: #F4E9CC;
        color: #F8C530;
      }
      /* ADDED: Hover effect for buttons that ARE in the 'on' state */
      .entity-button.state-on:hover {
        background-color: #F7EED8; /* A slightly lighter version of the 'on' color */
      }
      .entity-button.scene-activated {
        animation: scene-activation-fade 2s ease-out;
      }
      .button-icon {
        --mdc-icon-size: 22px;
      }
      .button-name {
        font-size: 12px;
        width: 100%;
        padding: 0 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        box-sizing: border-box;
        text-align: center;
      }
      .compact .entity-button {
        height: 42px;
      }
      .compact .button-name {
        display: none;
      }
      .error-banner {
        background-color: var(--error-color);
        color: var(--text-primary-color);
        padding: 16px;
        text-align: center;
      }
    `;
  }
}

customElements.define('flexible-area-card', FlexibleAreaCard);
