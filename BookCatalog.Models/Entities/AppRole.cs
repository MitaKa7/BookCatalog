using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Models
{
    public class AppRole : IdentityRole
    {
        public const string Reader = "Reader";
        public const string Editor = "Editor";
        public const string Admin = "Admin";
    }
}