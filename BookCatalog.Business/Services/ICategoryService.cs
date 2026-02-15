using BookCatalog.Models.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Business.Services
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllAsync();
        Task<CategoryDto> GetByIdAsync(int id);
        Task AddAsync(CategoryDto categoryDto);
        Task UpdateAsync(CategoryDto categoryDto);
        Task DeleteAsync(int id);
    }
}
