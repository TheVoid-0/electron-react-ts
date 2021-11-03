
export const SERIAL_ROUTES = {
    MODULE: { init: 'serial_module', destroy: 'serial_module_closed', },
    GET_PORTS: 'serial_module_get_ports',
    POST_AUTOREAD: 'serial_module_post_autoread',
    POST_OPEN_PORT: 'serial_module_post_open_port',
    POST_LED_STATUS: 'serial_module_post_led_status'
}
