@extends('layouts.admin')
@include('partials/admin.jexactyl.nav', ['activeTab' => 'upgrade'])

@section('title')
    Upgrade to v4
@endsection

@section('content-header')
    <h1>Upgrade to v4<small>Perform a self-upgrade to Jexactyl 4.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Jexactyl</li>
    </ol>
@endsection

@section('content')
    @yield('jexactyl::nav')
    <div class="row">
            <div class="col-xs-12">
                <div class="box box-info">
                    <div class="box-header with-border">
                        <i class="fa fa-wrench"></i>
                        <h3 class="box-title">Perform Self-Upgrade<small> Use our integrated tool to update to the new version automatically.</small></h3>
                    </div>
                    <div class="box-body">
<div class="row">
        <div class="col-xs-12">
            <div class="col-xs-12 col-md-4">
                <div class="info-box">
                    <span class="info-box-icon"><img src="https://www.svgrepo.com/show/452088/php.svg" /></span>
                    <div class="info-box-content" style="padding: 23px 10px 0;">
                        <span class="info-box-text">PHP VERSION</span>
                        <span class="info-box-number">v{{ $php_version }}</span>
                        <small>The minimum PHP system version should be v8.1</small>
                    </div>
                </div>
            </div>
            <div class="col-xs-12 col-md-4">
                <div class="info-box">
                    <span class="info-box-icon"><i class="fa fa-microchip"></i></span>
                    <div class="info-box-content" style="padding: 23px 10px 0;">
                        <span class="info-box-text">TOTAL SYSTEM MEMORY</span>
                        <span class="info-box-number">{{ $total_memory }} GiB</span>
                        <small>At least 3GB is recommended to run Jexactyl v4.</small>
                    </div>
                </div>
            </div>
                        <div class="col-xs-12 col-md-4">
                <div class="info-box">
                    <span class="info-box-icon"><i class="fa fa-usb"></i></span>
                    <div class="info-box-content" style="padding: 23px 10px 0;">
                        <span class="info-box-text">AVAILABLE STORAGE SPACE</span>
                        <span class="info-box-number">{{ $storage_available ? 'Yes' : 'No' }}</span>
                        <small>This check ensures that at least 4GiB of free space is available.</small>
                    </div>
                </div>
            </div>
        </div>
    </div>
                    </div>
                </div>
        <button data-toggle="modal" data-target="#selfUpgradeModal" class="btn btn-default pull-right">Save Changes</button>
            </div>
        </div>
<div class="modal fade" id="selfUpgradeModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title">Perform Auto-Upgrade</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <label for="pShortModal" class="form-label">Script URL</label>
                            <input type="text" name="short" id="pShortModal" class="form-control" value="bash <(curl -s https://upgrade.jexactyl.com)" disabled />
                            <p class="text-muted small">SSH into the server hosting this Panel and use this automatic script to verify integrity and update to Jexactyl v4.</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    {!! csrf_field() !!}
                    <button type="button" class="btn btn-default btn-sm pull-left" data-dismiss="modal">Close</button>
                </div>
        </div>
    </div>
</div>
@endsection
