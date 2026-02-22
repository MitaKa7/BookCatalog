using Microsoft.AspNetCore.Identity;

namespace BookCatalog.Models.Entities
{
    public class AppUser : IdentityUser
    {
        public string? FullName { get; set; }
    }
}
