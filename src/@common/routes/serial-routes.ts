
export const SERIAL_ROUTES = {
    MODULE: { init: 'serial_module', destroy: 'serial_module_closed', },
    GET_PORTS: 'serial_module_get_ports',
    POST_AUTOREAD: 'serial_module_post_autoread',
    POST_OPEN_PORT: 'serial_module_post_open_port',
    POST_CLOSE_PORT: 'serial_module_post_close_port',
    POST_LED_STATUS: 'serial_module_post_led_status',
    POST_SET_DATA_LISTENER: 'serial_module_set_data_listener',
    POST_REMOVE_DATA_LISTENER: 'serial_module_remove_data_listener',
    POST_DATA: 'serial_module_post_data',
}
