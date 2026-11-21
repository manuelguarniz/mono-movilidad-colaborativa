package pe.edu.utp.app_movilidadcolaborativa.wallet.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.utp.app_movilidadcolaborativa.wallet.application.BilleteraService;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.BilleteraDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.MovimientosDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargaDto;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RecargarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetirarRequest;
import pe.edu.utp.app_movilidadcolaborativa.wallet.domain.dto.RetiroDto;

/** Billetera (RF-11, RF-12); todas las rutas exigen un token SESSION (ver SecurityConfig). */
@RestController
@RequestMapping("/wallet")
@RequiredArgsConstructor
public class BilleteraController {

	private final BilleteraService billeteraService;

	@GetMapping
	public BilleteraDto consultar(@AuthenticationPrincipal Jwt jwt) {
		return billeteraService.consultar(usuarioId(jwt));
	}

	@GetMapping("/movements")
	public MovimientosDto movimientos(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "1") int page) {
		return billeteraService.movimientos(usuarioId(jwt), Math.max(1, page));
	}

	@PostMapping("/top-ups")
	@ResponseStatus(HttpStatus.CREATED)
	public RecargaDto recargar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RecargarRequest solicitud) {
		return billeteraService.recargar(usuarioId(jwt), solicitud);
	}

	@PostMapping("/withdrawals")
	@ResponseStatus(HttpStatus.CREATED)
	public RetiroDto retirar(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody RetirarRequest solicitud) {
		return billeteraService.retirar(usuarioId(jwt), solicitud);
	}

	private static ObjectId usuarioId(Jwt jwt) {
		return new ObjectId(jwt.getSubject());
	}
}
