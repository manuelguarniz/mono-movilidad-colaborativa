package pe.edu.utp.app_movilidadcolaborativa.users.domain.validation;

import pe.edu.utp.app_movilidadcolaborativa.users.domain.model.TipoDocumento;

import java.util.regex.Pattern;

/** Reglas de negocio de la cuenta y el perfil (RN-01 a RN-05 y RN-14). */
public final class ReglasUsuario {

	private static final Pattern CORREO_UTP = Pattern.compile("^[A-Za-z0-9._%+-]+@utp\\.edu\\.pe$", Pattern.CASE_INSENSITIVE);
	private static final Pattern CONTRASENA = Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$");
	private static final Pattern TIENE_LETRA = Pattern.compile("\\p{L}");
	private static final Pattern DNI = Pattern.compile("^\\d{8}$");
	private static final Pattern CARNE_EXTRANJERIA = Pattern.compile("^[A-Za-z0-9]{8,12}$");
	private static final int LARGO_MAXIMO_CORREO = 254;
	// BCrypt solo usa los primeros 72 bytes de la contraseña.
	private static final int LARGO_MAXIMO_CONTRASENA = 72;
	private static final int LARGO_MAXIMO_NOMBRE = 60;

	private ReglasUsuario() {
	}

	/** RN-01 y RN-02: solo correos del dominio utp.edu.pe. */
	public static boolean esCorreoUtp(String correo) {
		return correo != null && correo.length() <= LARGO_MAXIMO_CORREO && CORREO_UTP.matcher(correo).matches();
	}

	/** RN-03: al menos 8 caracteres con letras, números y símbolos. */
	public static boolean esContrasenaValida(String contrasena) {
		return contrasena != null && contrasena.length() <= LARGO_MAXIMO_CONTRASENA
				&& CONTRASENA.matcher(contrasena).matches();
	}

	/** RN-05: nombres y apellidos con al menos una letra. */
	public static boolean esNombreValido(String nombre) {
		return nombre != null && nombre.length() <= LARGO_MAXIMO_NOMBRE && TIENE_LETRA.matcher(nombre).find();
	}

	/** RN-14: un DNI tiene 8 dígitos; un carné de extranjería, entre 8 y 12 letras o números. */
	public static boolean esNumeroDocumentoValido(TipoDocumento tipo, String numero) {
		return numero != null && (tipo == TipoDocumento.DNI ? DNI : CARNE_EXTRANJERIA).matcher(numero).matches();
	}

	/** Nombre con el que los viajes copian al conductor: primer nombre e inicial del apellido («Carlos M.»). */
	public static String nombrePublico(String nombres, String apellidos) {
		return nombres.split("\\s+")[0] + " " + apellidos.substring(0, apellidos.offsetByCodePoints(0, 1)) + ".";
	}

	/** El correo se guarda y se busca en minúsculas. */
	public static String normalizarCorreo(String correo) {
		return correo == null ? null : correo.trim().toLowerCase();
	}
}
