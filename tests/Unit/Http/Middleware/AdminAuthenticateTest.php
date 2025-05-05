<?php

namespace Everest\Tests\Unit\Http\Middleware;

use Everest\Models\User;
use Everest\Models\AdminRole;
use Everest\Http\Middleware\AdminAuthenticate;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AdminAuthenticateTest extends MiddlewareTestCase
{
    /**
     * Test that an admin is authenticated with root admin permission.
     */
    public function testAdminsAreAuthenticatedWithRootAdminPermission()
    {
        $user = User::factory()->make(['root_admin' => 1]);

        $this->request->shouldReceive('user')->withNoArgs()->once()->andReturn($user);

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that an admin is authenticated with an admin role.
     */
    public function testAdminsAreAuthenticatedWithUserRole()
    {
        $role = AdminRole::factory()->create();
        $user = User::factory()->make(['admin_role_id' => $role->id]);

        $this->request->shouldReceive('user')->withNoArgs()->once()->andReturn($user);

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that a missing user in the request triggers an error.
     */
    public function testExceptionIsThrownIfUserDoesNotExist()
    {
        $this->expectException(AccessDeniedHttpException::class);

        $this->request->shouldReceive('user')->withNoArgs()->once()->andReturnNull();

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Test that an exception is thrown if the user is not an admin.
     */
    public function testExceptionIsThrownIfUserIsNotAnAdmin()
    {
        $this->expectException(AccessDeniedHttpException::class);

        $user = User::factory()->make(['root_admin' => 0]);

        $this->request->shouldReceive('user')->withNoArgs()->once()->andReturn($user);

        $this->getMiddleware()->handle($this->request, $this->getClosureAssertions());
    }

    /**
     * Return an instance of the middleware using mocked dependencies.
     */
    private function getMiddleware(): AdminAuthenticate
    {
        return new AdminAuthenticate();
    }
}
