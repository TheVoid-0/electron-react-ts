
export const SERIAL_ROUTES = {
    MODULE: { root: 'serial_module', res: 'serial_module_ready', destroy: 'serial_module_closed', },
    GET_PORTS: { req: 'serial_module_get_ports', res: 'serial_module_get_ports_ready' },
    POST_AUTOREAD: { req: 'serial_module_post_autoread', res: 'serial_module_post_autoread_ready' },
    POST_OPEN_PORT: { req: 'serial_module_post_open_port', res: 'serial_module_post_open_port_ready' },
    POST_LED_STATUS: { req: 'serial_module_post_led_status', res: 'serial_module_post_led_status_ready' }
}
