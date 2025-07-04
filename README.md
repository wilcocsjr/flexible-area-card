# flexible-area-card
Improved area card for Home Assstant


Flexible Area Card: Full Documentation
This card is designed to be a highly customizable version of the native Home Assistant Area Card. It operates in two primary modes, which are determined automatically based on your configuration.
Automatic Mode (Default): If you only provide an area, the card behaves like the standard HA Area Card. It automatically finds sensors and up to 3 controllable entities to display.
Flexible Grid Mode: If you provide an entities list, the card switches to a manual mode. It will display a grid containing only the entities you have listed, allowing for unlimited buttons that wrap automatically (up to 3 per row).
Main Configuration Options
These are the top-level parameters you can use in your card's YAML configuration.
Parameter	Type	Required?	Description
type	String	Yes	Must always be custom:flexible-area-card.
area	String	Yes	The ID of the area you want to display (e.g., living_room, escritorio). This is the core of the card.
area_name	String	No	Overrides the name of the area shown in the header. If not provided, it uses the area's default name.
icon	String	No	Overrides the main icon shown in the header (e.g., mdi:sofa). If not provided, it uses the area's default icon.
compact	Boolean	No	Defaults to false. When set to true, it enables the smaller, compact design with icon-only buttons.
tap_action	Object	No	Defines the action to take when the card's background is clicked. (See detailed section below).
entities	List	No	A list of entity IDs to display as buttons. Providing this option activates Flexible Grid Mode.
alert_classes	List	No	A list of binary_sensor device classes to show as alert icons in the top right. (See detailed section below).
sensor_classes	List	No	A list of sensor device classes to show in the header. The card shows the first one it finds. Defaults to ['temperature', 'humidity'].
secondary_info_entity	String	No	Manually sets a specific sensor entity to display in the header, overriding the sensor_classes logic.
Advanced Configuration Details
The tap_action Object
This feature allows you to define what happens when you click on the card's background (but not on a button). It mimics the functionality of native Home Assistant cards.
To navigate to another view or anchor:
action: navigate
navigation_path: The path of another dashboard view (e.g., office-details) or an anchor on the current page (e.g., #my-target-card).
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
service_data: (Optional) Data to pass to the service, like entity_id.
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
This option controls which binary sensors appear as small alert icons in the top-right corner.
Simple Usage (Default Color):
Provide a list of device classes. Any active sensor of that class will show up with the default orange color.
Generated yaml
# Shows an orange icon for any open door or window
type: custom:flexible-area-card
area: kitchen
alert_classes:
  - door
  - window
Use code with caution.
Yaml
Advanced Usage (Custom Colors):
To specify a color for an alert, turn it into an object. The color can be any valid CSS color string (e.g., rgb(255, 0, 0) or #FF0000).
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
