using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Basic hardcoded dummy auth for the portfolio scope
            if (request.Username == "admin" && request.Password == "admin123")
            {
                // Un JWT real iría acá en producción. Enviamos un token falso para simular login.
                return Ok(new { Token = "dummy-jwt-token-admin" });
            }

            return Unauthorized(new { Message = "Credenciales incorrectas" });
        }
    }
}
