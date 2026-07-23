/**
 * Calcula la edad exacta a partir de una fecha de nacimiento en formato
 * ISO (ej. "2000-08-25T14:50:00"), comparada contra la fecha actual.
 * Considera si ya pasó el cumpleaños de este año o no.
 */
export function calcularEdad(fechaNacimientoISO) {
    const nacimiento = new Date(fechaNacimientoISO)
    const hoy = new Date()
  
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
  
    const noHaCumplidoAunEsteAno =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())
  
    if (noHaCumplidoAunEsteAno) {
      edad -= 1
    }
  
    return edad
  }