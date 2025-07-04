Flexible Area Card
A highly customizable Lovelace card for Home Assistant that combines the beautiful design of the native Area Card with the flexibility to display an unlimited number of entities.
This card has two primary modes:
Automatic Mode: Just like the default Area Card, it automatically discovers and displays key entities and sensors from a specified area.
Flexible Grid Mode: Take full control and define a grid of buttons for any entities you want, with no limit on the number of buttons.
(Here you should add a screenshot of your card in action)
[Screenshot of the card in both default and compact modes]
Features
Automatic Mode: Mimics the native Area Card by default.
Flexible Grid Mode: Display an unlimited number of entities, which wrap automatically (3 per row).
Compact Display: An optional compact: true mode for a smaller, icon-only button layout.
Full tap_action Support: Supports navigate (to views or anchors), call-service, and other standard Home Assistant actions for the card background.
Customizable Header: Override the area name and icon.
Customizable Alert Icons: You choose which binary sensor device classes appear as alert icons in the top-right corner.
Custom Alert Colors: Define a unique color for each type of alert icon.
Customizable Sensor Display: Choose which sensor value is displayed in the header.
Customizable Entity Icons: Manually set icons for any button in Flexible Grid Mode.
Installation
HACS (Recommended)
Add this repository to HACS as a custom repository.
Go to HACS > Frontend.
Click the three-dot menu in the top right and select "Custom repositories".
Paste the URL to your GitHub repository.
Select the category: "Lovelace".
Click "Add".
The "Flexible Area Card" should now be available to install from the HACS Frontend tab. Click Install.
HACS will automatically add the resource to your Lovelace configuration.
Manual Installation
Download the flexible-area-card.js file from the latest release.
Place the file in your config/www/ directory. You can create a sub-folder if you wish (e.g., config/www/flexible-area-card/).
Add the resource to your Lovelace configuration.
Go to Settings > Dashboards.
Click the three-dot menu in the top right and select "Resources".
Click "+ Add Resource".
URL: /local/flexible-area-card.js (or the path to your sub-folder if you used one).
Resource Type: JavaScript Module.
Click "Create".
Refresh your browser.
Configuration
Main Options
Parameter	Type	Required?	Description
type	String	Yes	Must be custom:flexible-area-card.
area	String	Yes	The ID of the area to display (e.g., living_room).
area_name	String	No	Overrides the area's default name in the header.
icon	String	No	Overrides the area's default icon in the header.
compact	Boolean	No	Defaults to false. Set to true for the compact design.
tap_action	Object	No	Action to perform when clicking the card background. (See below).
entities	List	No	A list of entities to display. Activates Flexible Grid Mode.
alert_classes	List	No	A list of binary sensor classes to show as alert icons.
sensor_classes	List	No	A list of sensor classes to show in the header. Defaults to ['temperature', 'humidity'].
secondary_info_entity	String	No	Manually sets a specific sensor to display in the header.
Advanced Configuration Details
The tap_action Object
This allows you to make the card background interactive.
To navigate to another view or anchor:
action: navigate
navigation_path: The path of another dashboard view or an anchor on the current page (e.g., #details).
Generated yaml
# Example: Navigate to an anchor named 'details' on the current page
type: custom:flexible-area-card
area: office
tap_action:
  action: navigate
  navigation_path: '#details'
Use code with caution.
Yaml
To call a service:
action: call-service
service: The service to call (e.g., light.turn_on).
service_data: (Optional) Data to pass to the service.
Generated yaml
# Example: Call a service to turn on a scene
type: custom:flexible-area-card
area: living_room
tap_action:
  action: call-service
  service: scene.turn_on
  service_data:
    entity_id: scene.living_room_movie_mode
Use code with caution.
Yaml
Customizing Alert Icons and Colors (alert_classes)
Control which icons appear in the top-right corner.
Simple Usage (Default Color):
Any active sensor of these classes will show up with an orange "ball".
Generated yaml
type: custom:flexible-area-card
area: kitchen
alert_classes:
  - door
  - window
Use code with caution.
Yaml
Advanced Usage (Custom Colors):
To set a specific color, turn the alert into an object. The color can be any CSS color string.
Generated yaml
type: custom:flexible-area-card
area: basement
alert_classes:
  - device_class: moisture
    color: '#42A5F5'  # Blue ball for moisture alerts
  - device_class: smoke
    color: 'rgb(117, 117, 117)' # Grey ball for smoke alerts
  - motion                  # Motion alerts will use the default orange
Use code with caution.
Yaml
Customizing Entities in Flexible Grid Mode
When you define an entities list, you can override the name and icon for each button.
Generated yaml
type: custom:flexible-area-card
area: office
entities:
  # Simple entity, will use its default name and icon
  - light.office_ceiling

  # Entity with a custom name
  - entity: switch.desk_power_strip
    name: Desk Power

  # Entity with a custom name AND a custom icon
  - entity: fan.desk_fan
    name: Vornado
    icon: mdi:fan-auto
    
  # A scene entity
  - scene.office_focus_mode
