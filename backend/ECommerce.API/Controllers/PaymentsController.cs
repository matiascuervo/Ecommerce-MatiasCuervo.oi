using ECommerce.API.Data;
using Microsoft.AspNetCore.Mvc;
using MercadoPago.Client.Preference;
using MercadoPago.Config;
using MercadoPago.Resource.Preference;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public PaymentsController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            MercadoPagoConfig.AccessToken = "TEST-1654585096853637-032018-6e50c45e5605a72f3bf6eb7b1eab4424-153301281";
        }

        public class PaymentRequest
        {
            public int OrderId { get; set; }
        }

        [HttpPost("create-preference")]
        public async Task<ActionResult<object>> CreatePreference([FromBody] PaymentRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
                return NotFound("Order not found.");

            var items = new List<PreferenceItemRequest>();

            foreach (var item in order.Items)
            {
                if (item.Product != null)
                {
                    items.Add(new PreferenceItemRequest
                    {
                        Title = item.Product.Name,
                        Quantity = item.Quantity,
                        CurrencyId = "ARS", // Adjust depending on country
                        UnitPrice = item.UnitPrice,
                    });
                }
            }

            var preferenceRequest = new PreferenceRequest
            {
                Items = items,
                BackUrls = new PreferenceBackUrlsRequest
                {
                   Success = "http://127.0.0.1:5500/index.html", 
                    Failure = "http://127.0.0.1:5500/index.html",
                    Pending = "http://127.0.0.1:5500/index.html"
                }
            };

            var client = new PreferenceClient();
            Preference preference = await client.CreateAsync(preferenceRequest);

            order.MercadoPagoPreferenceId = preference.Id;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Id = preference.Id,
                InitPoint = preference.InitPoint,
                SandboxInitPoint = preference.SandboxInitPoint
            });
        }
    }
}
