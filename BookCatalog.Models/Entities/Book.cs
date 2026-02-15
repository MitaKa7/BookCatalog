using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Models.Entities
{
    public class Book
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        public int AuthorId { get; set; }
        public int CategoryId { get; set; }

        public decimal Price { get; set; }

        public Author Author { get; set; }
        public Category Category { get; set; }
    }
}
