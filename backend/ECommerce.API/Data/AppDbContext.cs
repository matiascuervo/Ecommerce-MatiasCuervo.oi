using ECommerce.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<Product>()
                .Property(p => p.Price)
                .HasColumnType("decimal(18,2)");
                
            modelBuilder.Entity<Order>()
                .Property(o => o.TotalAmount)
                .HasColumnType("decimal(18,2)");
                
            modelBuilder.Entity<OrderItem>()
                .Property(oi => oi.UnitPrice)
                .HasColumnType("decimal(18,2)");

            // Seed initial mock data
            var staticDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "Camiseta Básica", Description = "Algodón 100%, ajuste perfecto.", Price = 15.99m, ImageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", Stock = 100, CreatedAt = staticDate },
                new Product { Id = 2, Name = "Zapatillas Urbanas", Description = "Cómodas para el día a día.", Price = 45.00m, ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", Stock = 50, CreatedAt = staticDate },
                new Product { Id = 3, Name = "Mochila Minimalista", Description = "Repelente al agua, diseño moderno.", Price = 35.50m, ImageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", Stock = 30, CreatedAt = staticDate },
                new Product { Id = 4, Name = "Reloj Clásico", Description = "Correa de cuero, resistente al agua.", Price = 89.90m, ImageUrl = "https://images.unsplash.com/photo-1524805444758-089113d48a6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", Stock = 15, CreatedAt = staticDate }
            );
        }
    }
}
