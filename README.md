# Flexible Area Card

A highly customizable Lovelace card to summarize and control a Home Assistant Area. This card provides an elegant overview of an area, automatically surfacing key controls and sensor information, while also allowing for deep manual customization.

The "automatic" mode is intelligently designed to find and display all **Light Groups** and **Scenes** associated with an area, providing the most actionable controls without any manual configuration.

![Flexible Area Card Screenshot](https://user-images.githubusercontent.com/3356254/187915392-1a8470a1-7786-43b7-a3a8-e1de32e91547.png)
*(This is an example image. You should replace this with a screenshot of your card in action!)*

## Features

*   **Automatic Mode:** No `entities` list required! The card automatically discovers and displays all Light Groups and Scenes within the specified area.
*   **Manual Mode:** Define a specific list of entities for granular control over the buttons shown.
*   **Informative Header:** Displays the area name, a custom icon, and can show the state of a key sensor (e.g., temperature) as secondary information.
*   **Summary Icons:** At-a-glance status icons for alerts (motion, doors, windows) and sensors (temperature, humidity). Colors are fully customizable.
*   **Dynamic Grid:** The entity buttons are arranged in a clean grid that adjusts based on the number of entities.
*   **Compact Mode:** A smaller version of the card that shows only icons for a minimalist dashboard.
*   **Tap Actions:** Supports `tap_action` for navigating to another view or calling a service when the main card area is clicked.

## Installation

### Method 1: HACS (Recommended)

This card is not in the default HACS store. You can add it as a custom repository.

1.  Go to HACS > Frontend.
2.  Click the 3-dots menu in the top right and select **"Custom repositories"**.
3.  In the "Repository" field, paste the URL to your GitHub repository (e.g., `https://github.com/YOUR_USERNAME/YOUR_REPOSITORY`).
4.  Select the category **"Lovelace"**.
5.  Click **"Add"**. The card will now be available to install from the HACS frontend.

### Method 2: Manual Installation

1.  Download the `flexible-area-card.js` file from the latest [release](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY/releases).
2.  Place the downloaded file into your `config/www/` directory. You may need to create a subdirectory, for example, `config/www/community/flexible-area-card/`.
3.  Add the resource reference to your Lovelace configuration. Go to **Settings > Dashboards**, click the 3-dots menu, and select **"Resources"**.
4.  Click **"Add Resource"**:
    *   Set **URL** to `/local/community/flexible-area-card/flexible-area-card.js` (adjust the path if you used a different one).
    *   Set **Resource type** to `JavaScript Module`.
5.  Save.

## Configuration

### Main Options

| Parameter               | Required | Description                                                                                                                                                             |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                  | **Yes**  | `custom:flexible-area-card`                                                                                                                                             |
| `area`                  | **Yes**  | The `area_id` of the area you want to display (e.g., `living_room`, `kitchen`).                                                                                         |
| `area_name`             | No       | Override the friendly name of the area.                                                                                                                                 |
| `icon`                  | No       | Override the default area icon in the header.                                                                                                                           |
| `entities`              | No       | A list of entities to display as buttons. If omitted, the card enters "automatic" mode. See detailed breakdown below for customization.                                  |
| `compact`               | No       | Set to `true` for a compact view that hides entity names. Default is `false`.                                                                                           |
| `tap_action`            | No       | A standard Home Assistant [action object](https://www.home-assistant.io/lovelace/actions/) to execute when the card's background is tapped.                               |
| `secondary_info_entity` | No       | An entity ID whose state will be displayed as secondary info in the header (e.g., `sensor.living_room_temperature`).                                                    |
| `alert_classes`         | No       | A list of sensor `device_class` for "alert" summary icons. See detailed breakdown below. Defaults to `['motion', 'occupancy', 'moisture', 'door', 'window']`.           |
| `sensor_classes`        | No       | A list of sensor `device_class` for "sensor" summary icons. See detailed breakdown below. Defaults to `['temperature', 'humidity']`.                                     |

### Detailed Parameter Breakdown

#### `entities` (list)
Used to manually define which buttons appear on the card. Each item in the list can be a simple string (the entity ID) or an object for further customization.

```yaml
entities:
  # Simple form:
  - light.kitchen_main_lights
  # Object form (for customization):
  - entity: scene.kitchen_cooking
    name: Cooking Mode
    icon: mdi:pot-steam
```

**Entity Object Properties:**

| Parameter | Required | Description                            |
| --------- | -------- | -------------------------------------- |
| `entity`  | **Yes**  | The full `entity_id` of the entity.    |
| `name`    | No       | Override the button's name.            |
| `icon`    | No       | Override the button's icon.            |

---

#### `alert_classes` & `sensor_classes` (list)
These lists define which summary icons appear in the header. Each item can be a simple string (the `device_class`) to use default settings, or an object to specify a custom color.

```yaml
alert_classes:
  # Simple form (uses default alert color):
  - motion
  # Object form (for custom color):
  - device_class: door
    color: 'var(--accent-color)'
```

**Alert/Sensor Object Properties:**

| Parameter        | Required | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `device_class`   | **Yes**  | The `device_class` to look for (e.g., `motion`, `temperature`, `door`).     |
| `color`          | No       | A custom CSS color for the icon's background (e.g., `#ff9800`, `var(--blue-color)`). |

## Examples

### 1. Basic Automatic Configuration

This is the simplest way to use the card. It will automatically find all light groups and scenes in your "Living Room" area, use the default summary icons, and display them.

```yaml
type: custom:flexible-area-card
area: living_room
```

### 2. Advanced Manual Configuration

This example uses all major options for a fully customized card.

```yaml
type: custom:flexible-area-card
# --- Basic Info ---
area: kitchen
area_name: "Chef's Domain"
icon: mdi:silverware-fork-knife

# --- Layout & Actions ---
compact: true
tap_action:
  action: navigate
  navigation_path: /lovelace/kitchen-detail

# --- Header & Summary Icons (with custom colors) ---
secondary_info_entity: sensor.kitchen_temperature
alert_classes:
  - motion
  - device_class: door
    color: 'var(--accent-color)' # Use a theme variable
  - window
sensor_classes:
  - temperature
  - device_class: humidity
    color: '#3498db' # Use a hex code

# --- Manual Entity Buttons (with custom names/icons) ---
entities:
  - entity: light.kitchen_main_lights
    name: Main
    icon: mdi:ceiling-light
  - entity: light.kitchen_island_pendants
    name: Island
  - entity: scene.kitchen_cooking_mode
    name: Cooking
    icon: mdi:pot-steam
  - entity: switch.coffee_machine
```
