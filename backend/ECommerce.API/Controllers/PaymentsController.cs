using ECommerce.API.Data;
using Microsoft.AspNetCore.Mvc;
using MercadoPago.Client.Preference;
using MercadoPago.Client.Payment;
using MercadoPago.Config;
using MercadoPago.Resource.Payment;
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
            MercadoPagoConfig.AccessToken = _configuration["MercadoPago:AccessToken"];
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
                ExternalReference = order.Id.ToString(),
                NotificationUrl = $"{_configuration["MercadoPago:NotificationUrlBase"]}/api/payments/webhook",
                BackUrls = new PreferenceBackUrlsRequest
                {
                    Success = "http://127.0.0.1:5500/index.html", 
                    Failure = "http://127.0.0.1:5500/index.html",
                    Pending = "http://127.0.0.1:5500/index.html"
                },
                AutoReturn = "approved"
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

        [HttpPost("webhook")]
        public async Task<IActionResult> Webhook([FromQuery] string topic, [FromQuery] string id)
        {
            try
            {
                // Mercado Pago sends 'topic' for IPN or 'type' for Webhooks. 
                // We handle both or focus on 'payment'.
                string resourceId = id;
                string resourceType = topic;

                // If it's a webhook notification, it might come in the body
                if (string.IsNullOrEmpty(resourceId))
                {
                    // For simplified Webhook v2, the ID might be in the body.
                    // But let's stick to the query params for now as a baseline.
                    return Ok(); 
                }

                if (resourceType == "payment")
                {
                    var client = new PaymentClient();
                    Payment payment = await client.GetAsync(long.Parse(resourceId));

                    if (payment != null && !string.IsNullOrEmpty(payment.ExternalReference))
                    {
                        var orderId = int.Parse(payment.ExternalReference);
                        var order = await _context.Orders.FindAsync(orderId);

                        if (order != null)
                        {
                            order.PaymentStatus = payment.Status switch
                            {
                                "approved" => "Paid",
                                "rejected" => "PaymentRejected",
                                "pending" => "PendingPayment",
                                _ => order.PaymentStatus
                            };

                            await _context.SaveChangesAsync();
                            Console.WriteLine($"Order {orderId} updated to {order.PaymentStatus}");
                        }
                    }
                }

                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook Error: {ex.Message}");
                return StatusCode(500);
            }
        }
    }
}
