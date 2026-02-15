using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BookCatalog.Models.DTOs;

namespace BookCatalog.Business.Services
{
    public interface IAuthorService
    {
        Task<IEnumerable<AuthorDto>> GetAllAsync();
        Task<AuthorDto> GetByIdAsync(int id);
        Task AddAsync(AuthorDto authorDto);
        Task UpdateAsync(AuthorDto authorDto);
        Task DeleteAsync(int id);
    }
}
