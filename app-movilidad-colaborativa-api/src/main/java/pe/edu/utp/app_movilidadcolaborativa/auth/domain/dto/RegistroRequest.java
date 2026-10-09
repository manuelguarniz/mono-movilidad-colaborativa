package pe.edu.utp.app_movilidadcolaborativa.auth.domain.dto;

public record RegistroRequest(String email, String password, Boolean acceptedTerms) {
}
