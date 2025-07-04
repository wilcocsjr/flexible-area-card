# Flexible Area Card for Home Assistant

[![HACS Default](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration)

A highly customizable Lovelace card that combines the beautiful, native design of the Home Assistant Area Card with the power and flexibility to display an unlimited number of entities.

This card operates in two primary modes:
1.  **Automatic Mode:** Just like the default Area Card, it automatically discovers and displays key entities and sensors from a specified area.
2.  **Flexible Grid Mode:** Take full control and define a grid of buttons for any entities you want—including scenes—with no limit on the number of buttons.

![Screenshot of Flexible Area Card](httpsd://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPOSITORY/main/screenshot.png) 
*(**Note:** You should replace the URL above with a real link to a screenshot of your card in your repository)*

---

## Features

-   **Automatic Mode:** Perfectly mimics the native Area Card by default.
-   **Flexible Grid Mode:** Display an unlimited number of entities, which wrap automatically (3 per row).
-   **Compact Display:** An optional `compact: true` mode for a smaller, icon-only button layout.
-   **Full `tap_action` Support:** Supports `navigate` (to other views or anchors), `call-service`, and other standard Home Assistant actions for the card background.
-   **Scene Support:** Activate scenes directly from a button.
-   **Customizable Header:** Override the area name and icon.
-   **Customizable Alert Icons:** You choose which binary sensor device classes appear as alert icons in the top-right corner.
-   **Custom Alert Colors:** Define a unique color for the background "ball" of each alert type.
-   **Customizable Sensor Display:** Choose which sensor value is displayed in the header.
-   **Customizable Entity Icons:** Manually set icons for any button in Flexible Grid Mode.

---

## Installation

### HACS (Recommended)

1.  **Add Custom Repository:**
    -   Go to **HACS > Frontend**.
    -   Click the three-dot menu in the top right and select **"Custom repositories"**.
    -   Paste the URL to this GitHub repository.
    -   Select the category: **"Lovelace"**.
    -   Click **"Add"**.
2.  **Install Card:**
    -   The "Flexible Area Card" should now be available to install from the HACS Frontend tab. Click **Install**.
    -   HACS will automatically add the necessary resource to your Lovelace configuration.

### Manual Installation

1.  Download the `flexible-area-card.js` file from the latest [Release](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY/releases).
2.  Place the file in your `config/www/` directory. You can create a sub-folder if you wish (e.g., `config/www/flexible-area-card/`).
3.  Add the resource to your Lovelace configuration:
    -   Go to **Settings > Dashboards**.
    -   Click the three-dot menu in the top right and select **"Resources"**.
    -   Click **"+ Add Resource"**.
    -   **URL:** `/local/flexible-area-card.js` (or the path to your sub-folder if you used one).
    -   **Resource Type:** `JavaScript Module`.
    -   Click **"Create"**.
4.  Refresh your browser.

---

## Configuration

### Main Options

| Parameter | Type | Required? | Description |
| :--- | :------ | :--- | :--- |
| `type` | String | **Yes** | Must be `custom:flexible-area-card`. |
| `area` | String | **Yes** | The ID of the area to display (e.g., `living_room`). |
| `area_name` | String | No | Overrides the area's default name in the header. |
| `icon` | String | No | Overrides the area's default icon in the header. |
| `compact` | Boolean | No | Defaults to `false`. Set to `true` for the compact design. |
| `tap_action` | Object | No | Action to perform when clicking the card background. (See below).|
| `entities` | List | No | A list of entities to display. **Activates Flexible Grid Mode.** |
| `alert_classes` | List | No | List of `binary_sensor` classes to show as alert icons. |
| `sensor_classes`| List | No | List of `sensor` classes to show in the header. Defaults to `['temperature', 'humidity']`. |
| `secondary_info_entity` | String | No | Manually sets a specific sensor to display in the header. |

### Advanced Configuration Details

#### The `tap_action` Object

This allows you to make the card background interactive. To navigate to another card on the same page, you must give the target card a `card_id`.

```yaml
# Example: Navigate to an anchor named 'details' on the current page
type: custom:flexible-area-card
area: office
tap_action:
  action: navigate
  navigation_path: '#details'
